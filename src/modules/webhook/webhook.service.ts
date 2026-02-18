import axios from 'axios';
import config from '../../infrastructure/config';
import logger from '../../infrastructure/logger';
import { Job } from '@prisma/client';

export interface N8nWebhookPayload {
  jobId: string;
  title: string;
  description: string;
}

export class WebhookService {
  async sendJobToN8n(job: Job): Promise<void> {
    try {
      const payload: N8nWebhookPayload = {
        jobId: job.id,
        title: job.title,
        description: job.description,
      };

      logger.info('Sending job to n8n webhook', { jobId: job.id, url: config.n8nWebhookUrl });

      await axios.post(config.n8nWebhookUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000, // 10 second timeout
      });

      logger.info('Successfully sent job to n8n webhook', { jobId: job.id });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        logger.error('Error sending job to n8n webhook', {
          jobId: job.id,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message,
        });
      } else {
        logger.error('Unexpected error sending job to n8n webhook', {
          jobId: job.id,
          error,
        });
      }
      throw error;
    }
  }

  async sendJobsToN8n(jobs: Job[]): Promise<void> {
    const promises = jobs.map((job) => this.sendJobToN8n(job));
    await Promise.allSettled(promises);
  }
}

export default new WebhookService();
