import { workspaceService as localService } from './workspaceServiceLocal';
import { workspaceService as fargateService } from './workspaceServiceFargate';

// Re-export types
export type ProgressCallback = (message: string, progress: number) => void;

// Determine which service to use
// We use Fargate service if ECS_CLUSTER_NAME is set (which we do in Fargate task def)
const useFargate = process.env.ECS_CLUSTER_NAME !== undefined;

console.log(`[WorkspaceService] Initializing... Mode: ${useFargate ? 'FARGATE' : 'LOCAL_DOCKER'}`);

if (useFargate) {
  console.log(`[WorkspaceService] Using ECS Cluster: ${process.env.ECS_CLUSTER_NAME}`);
}

export const workspaceService = useFargate ? fargateService : localService;
