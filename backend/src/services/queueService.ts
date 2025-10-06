import Queue from 'bull';
import { logger } from '../utils/logger';

// Define job types
export interface ExportJobData {
  versionId: number;
  format: 'pdf' | 'docx' | 'scorm';
  language: string;
  watermark: boolean;
  userId: number;
  tenantId: number;
}

export interface ValidationJobData {
  versionId: number;
  userId: number;
  tenantId: number;
}

// Create queues
const exportQueue = new Queue<ExportJobData>('curriculum-export', {
  redis: process.env.REDIS_URL || 'redis://localhost:6379',
  defaultJobOptions: {
    removeOnComplete: 50,
    removeOnFail: 20,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
  },
});

const validationQueue = new Queue<ValidationJobData>('curriculum-validation', {
  redis: process.env.REDIS_URL || 'redis://localhost:6379',
  defaultJobOptions: {
    removeOnComplete: 10,
    removeOnFail: 5,
  },
});

// Queue event handlers
exportQueue.on('completed', (job, result) => {
  logger.info('Export job completed', {
    jobId: job.id,
    versionId: job.data.versionId,
    format: job.data.format,
    duration: Date.now() - job.timestamp
  });
});

exportQueue.on('failed', (job, err) => {
  logger.error('Export job failed', {
    jobId: job.id,
    versionId: job.data.versionId,
    error: err.message,
    attempts: job.attemptsMade
  });
});

validationQueue.on('completed', (job) => {
  logger.info('Validation job completed', {
    jobId: job.id,
    versionId: job.data.versionId
  });
});

// Export queue instances
export { exportQueue, validationQueue };

// Initialize function
export const initializeQueues = async (): Promise<void> => {
  try {
    // Register queue processors
    await registerQueueProcessors();
    logger.info('Queue processors registered');
  } catch (error) {
    logger.error('Failed to initialize queues:', error);
    throw error;
  }
};

// Register queue processors
const registerQueueProcessors = async (): Promise<void> => {
  // Export processor
  exportQueue.process(async (job) => {
    const { versionId, format, language, watermark, userId, tenantId } = job.data;

    logger.info('Processing export job', {
      jobId: job.id,
      versionId,
      format,
      userId
    });

    // TODO: Implement actual export logic
    // This would call the export service with the job data

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000));

    return {
      success: true,
      fileUrl: `https://cdn.example.com/exports/kct-${versionId}-v1.0.${format}`,
      checksum: 'sha256:abc123...',
      fileSize: 1024000
    };
  });

  // Validation processor
  validationQueue.process(async (job) => {
    const { versionId, userId, tenantId } = job.data;

    logger.info('Processing validation job', {
      jobId: job.id,
      versionId,
      userId
    });

    // TODO: Implement actual validation logic
    // This would run all validation rules against the version

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000));

    return {
      success: true,
      errors: [],
      warnings: [],
      readinessScore: 95
    };
  });
};

// Helper functions to add jobs to queues
export const addExportJob = async (data: ExportJobData): Promise<string> => {
  const job = await exportQueue.add('export', data, {
    priority: 5,
    delay: 0,
  });

  logger.info('Export job added to queue', {
    jobId: job.id,
    versionId: data.versionId,
    format: data.format
  });

  return job.id as string;
};

export const addValidationJob = async (data: ValidationJobData): Promise<string> => {
  const job = await validationQueue.add('validate', data, {
    priority: 10, // Higher priority for validations
    delay: 0,
  });

  logger.info('Validation job added to queue', {
    jobId: job.id,
    versionId: data.versionId
  });

  return job.id as string;
};

// Get job status
export const getJobStatus = async (queueName: string, jobId: string) => {
  let queue: Queue;
  switch (queueName) {
    case 'export':
      queue = exportQueue;
      break;
    case 'validation':
      queue = validationQueue;
      break;
    default:
      throw new Error(`Unknown queue: ${queueName}`);
  }

  const job = await queue.getJob(jobId);
  if (!job) {
    return null;
  }

  const state = await job.getState();
  const progress = job.progress();

  return {
    id: job.id,
    state,
    progress,
    data: job.data,
    opts: job.opts,
    createdAt: job.timestamp,
    startedAt: job.processedOn,
    finishedAt: job.finishedOn,
    failedReason: job.failedReason,
    returnValue: job.returnvalue,
  };
};

// Graceful shutdown
export const closeQueues = async (): Promise<void> => {
  await exportQueue.close();
  await validationQueue.close();
  logger.info('Queues closed');
};