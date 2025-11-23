import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function testDockerCommand() {
    console.log('Testing Docker command...');

    const containerName = 'test-codeserver';
    const port = 9000;
    const dockerCommand = `docker run -d --name ${containerName} -p ${port}:8080 -v ${containerName}-data:/home/coder/project -e PASSWORD=apranova123 codercom/code-server:latest`;

    console.log('Command:', dockerCommand);

    try {
        const { stdout, stderr } = await execAsync(dockerCommand);
        console.log('Success!');
        console.log('stdout:', stdout);
        if (stderr) console.log('stderr:', stderr);

        // Clean up
        console.log('\nCleaning up...');
        await execAsync(`docker stop ${containerName}`);
        await execAsync(`docker rm ${containerName}`);
        await execAsync(`docker volume rm ${containerName}-data`);
        console.log('Cleanup complete');

    } catch (error: any) {
        console.error('Error running Docker command:');
        console.error('Message:', error.message);
        console.error('stdout:', error.stdout);
        console.error('stderr:', error.stderr);
    }
}

testDockerCommand();
