/**
 * Dynamic Resource Allocation Lambda for Code-Server Workspaces
 * 
 * This Lambda function monitors code-server tasks and dynamically adjusts their resources:
 * 1. Initial Launch: High CPU/Memory for fast IDE rendering
 * 2. After 5 minutes idle: Switch to low CPU/Memory for cost savings
 * 3. High load detected: Switch to max CPU/Memory for performance
 */

const { ECSClient, ListTasksCommand, DescribeTasksCommand, UpdateServiceCommand, StopTaskCommand, RunTaskCommand, DescribeServicesCommand } = require('@aws-sdk/client-ecs');
const { CloudWatchClient, GetMetricStatisticsCommand } = require('@aws-sdk/client-cloudwatch');

const ecs = new ECSClient({ region: process.env.AWS_REGION });
const cloudwatch = new CloudWatchClient({ region: process.env.AWS_REGION });

const CLUSTER_NAME = process.env.ECS_CLUSTER_NAME;
const CODE_SERVER_TASK_FAMILY = process.env.CODE_SERVER_TASK_FAMILY;
const CODE_SERVER_IDLE_TASK_FAMILY = process.env.CODE_SERVER_IDLE_TASK_FAMILY;
const CODE_SERVER_PERF_TASK_FAMILY = process.env.CODE_SERVER_PERF_TASK_FAMILY;

const INITIAL_CPU = parseInt(process.env.INITIAL_CPU);
const INITIAL_MEMORY = parseInt(process.env.INITIAL_MEMORY);
const IDLE_CPU = parseInt(process.env.IDLE_CPU);
const IDLE_MEMORY = parseInt(process.env.IDLE_MEMORY);
const MAX_CPU = parseInt(process.env.MAX_CPU);
const MAX_MEMORY = parseInt(process.env.MAX_MEMORY);

const IDLE_TRANSITION_MINUTES = parseInt(process.env.IDLE_TRANSITION_MINUTES || '5');
const CPU_THRESHOLD_FOR_UPGRADE = parseInt(process.env.CPU_THRESHOLD_FOR_UPGRADE || '80');
const MEMORY_THRESHOLD_FOR_UPGRADE = parseInt(process.env.MEMORY_THRESHOLD_FOR_UPGRADE || '85');

exports.handler = async (event) => {
    console.log('Starting resource optimization check...');

    try {
        // Get all running code-server tasks
        const listTasksResponse = await ecs.send(new ListTasksCommand({
            cluster: CLUSTER_NAME,
            desiredStatus: 'RUNNING'
        }));

        if (!listTasksResponse.taskArns || listTasksResponse.taskArns.length === 0) {
            console.log('No running tasks found');
            return { statusCode: 200, body: 'No tasks to optimize' };
        }

        // Describe tasks to get details
        const describeTasksResponse = await ecs.send(new DescribeTasksCommand({
            cluster: CLUSTER_NAME,
            tasks: listTasksResponse.taskArns
        }));

        const optimizationActions = [];

        for (const task of describeTasksResponse.tasks) {
            // Only process code-server tasks
            if (!task.taskDefinitionArn.includes('code-server')) {
                continue;
            }

            const taskId = task.taskArn.split('/').pop();
            const startTime = new Date(task.startedAt);
            const currentTime = new Date();
            const runningMinutes = (currentTime - startTime) / (1000 * 60);

            console.log(`Processing task ${taskId}, running for ${runningMinutes.toFixed(2)} minutes`);

            // Get current task definition to determine resource tier
            const currentTaskDef = task.taskDefinitionArn;
            const currentTier = getCurrentTier(currentTaskDef);

            // Get CPU and Memory metrics
            const cpuUtilization = await getMetricAverage(taskId, 'CPUUtilization', 5);
            const memoryUtilization = await getMetricAverage(taskId, 'MemoryUtilization', 5);

            console.log(`Task ${taskId} - Tier: ${currentTier}, CPU: ${cpuUtilization}%, Memory: ${memoryUtilization}%`);

            // Decision logic for resource allocation
            let targetTier = currentTier;

            if (currentTier === 'initial') {
                // After 5 minutes, if CPU/Memory is low, switch to idle tier
                if (runningMinutes >= IDLE_TRANSITION_MINUTES &&
                    cpuUtilization < 30 &&
                    memoryUtilization < 40) {
                    targetTier = 'idle';
                    console.log(`Task ${taskId}: Transitioning to IDLE tier (cost-saving mode)`);
                }
                // If high load detected early, switch to performance tier
                else if (cpuUtilization >= CPU_THRESHOLD_FOR_UPGRADE ||
                    memoryUtilization >= MEMORY_THRESHOLD_FOR_UPGRADE) {
                    targetTier = 'performance';
                    console.log(`Task ${taskId}: Upgrading to PERFORMANCE tier (high load detected)`);
                }
            } else if (currentTier === 'idle') {
                // If load increases, switch to performance tier
                if (cpuUtilization >= CPU_THRESHOLD_FOR_UPGRADE ||
                    memoryUtilization >= MEMORY_THRESHOLD_FOR_UPGRADE) {
                    targetTier = 'performance';
                    console.log(`Task ${taskId}: Upgrading from IDLE to PERFORMANCE tier`);
                }
            } else if (currentTier === 'performance') {
                // If load decreases significantly, switch back to idle
                if (cpuUtilization < 20 && memoryUtilization < 30 && runningMinutes >= 10) {
                    targetTier = 'idle';
                    console.log(`Task ${taskId}: Downgrading from PERFORMANCE to IDLE tier`);
                }
            }

            // If tier change is needed, replace the task
            if (targetTier !== currentTier) {
                const action = await replaceTask(task, targetTier);
                optimizationActions.push(action);
            }
        }

        console.log(`Optimization complete. Actions taken: ${optimizationActions.length}`);

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Resource optimization completed',
                actions: optimizationActions
            })
        };

    } catch (error) {
        console.error('Error during resource optimization:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};

function getCurrentTier(taskDefinitionArn) {
    if (taskDefinitionArn.includes('code-server-idle')) {
        return 'idle';
    } else if (taskDefinitionArn.includes('code-server-performance')) {
        return 'performance';
    } else {
        return 'initial';
    }
}

function getTaskDefinitionForTier(tier) {
    switch (tier) {
        case 'idle':
            return CODE_SERVER_IDLE_TASK_FAMILY;
        case 'performance':
            return CODE_SERVER_PERF_TASK_FAMILY;
        default:
            return CODE_SERVER_TASK_FAMILY;
    }
}

async function getMetricAverage(taskId, metricName, minutes) {
    try {
        const endTime = new Date();
        const startTime = new Date(endTime.getTime() - minutes * 60 * 1000);

        const response = await cloudwatch.send(new GetMetricStatisticsCommand({
            Namespace: 'AWS/ECS',
            MetricName: metricName,
            Dimensions: [
                {
                    Name: 'ClusterName',
                    Value: CLUSTER_NAME
                },
                {
                    Name: 'TaskId',
                    Value: taskId
                }
            ],
            StartTime: startTime,
            EndTime: endTime,
            Period: 60,
            Statistics: ['Average']
        }));

        if (response.Datapoints && response.Datapoints.length > 0) {
            const sum = response.Datapoints.reduce((acc, dp) => acc + dp.Average, 0);
            return sum / response.Datapoints.length;
        }

        return 0;
    } catch (error) {
        console.error(`Error getting metric ${metricName}:`, error);
        return 0;
    }
}

async function replaceTask(task, targetTier) {
    try {
        const taskId = task.taskArn.split('/').pop();
        const targetTaskDefinition = getTaskDefinitionForTier(targetTier);

        console.log(`Replacing task ${taskId} with ${targetTaskDefinition}`);

        // Extract network configuration from current task
        const networkConfiguration = {
            awsvpcConfiguration: {
                subnets: task.attachments[0].details.find(d => d.name === 'subnetId')?.value ?
                    [task.attachments[0].details.find(d => d.name === 'subnetId').value] : [],
                securityGroups: task.attachments[0].details
                    .filter(d => d.name === 'networkInterfaceId')
                    .map(d => d.value),
                assignPublicIp: 'DISABLED'
            }
        };

        // Start new task with target tier
        const runTaskResponse = await ecs.send(new RunTaskCommand({
            cluster: CLUSTER_NAME,
            taskDefinition: targetTaskDefinition,
            launchType: 'FARGATE',
            networkConfiguration: networkConfiguration,
            tags: task.tags
        }));

        console.log(`New task started: ${runTaskResponse.tasks[0].taskArn}`);

        // Wait a bit for the new task to start
        await new Promise(resolve => setTimeout(resolve, 30000)); // 30 seconds

        // Stop the old task
        await ecs.send(new StopTaskCommand({
            cluster: CLUSTER_NAME,
            task: task.taskArn,
            reason: `Resource optimization: switching to ${targetTier} tier`
        }));

        console.log(`Old task ${taskId} stopped`);

        return {
            oldTask: taskId,
            newTask: runTaskResponse.tasks[0].taskArn.split('/').pop(),
            tier: targetTier,
            timestamp: new Date().toISOString()
        };

    } catch (error) {
        console.error(`Error replacing task:`, error);
        throw error;
    }
}
