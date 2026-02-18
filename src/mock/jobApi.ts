import { CreateJobDto } from '../modules/jobs/job.types';

/**
 * Mock job API service
 * In production, this would fetch from a real job API
 */
export class MockJobApi {
  async fetchJobs(): Promise<CreateJobDto[]> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Return mock job data
    return [
      {
        title: 'Senior Full Stack Developer',
        description:
          'We are looking for an experienced full stack developer to join our team. You will work on cutting-edge web applications using React, Node.js, and PostgreSQL. The ideal candidate has 5+ years of experience and is passionate about clean code and best practices.',
        url: 'https://example.com/jobs/senior-full-stack-developer',
      },
      {
        title: 'DevOps Engineer',
        description:
          'Join our infrastructure team to help scale our platform. You will work with Kubernetes, Docker, AWS, and CI/CD pipelines. Experience with monitoring and observability tools is a plus.',
        url: 'https://example.com/jobs/devops-engineer',
      },
      {
        title: 'Machine Learning Engineer',
        description:
          'We are seeking a ML engineer to develop and deploy machine learning models. You will work with Python, TensorFlow, and cloud ML services. Experience with NLP and computer vision is preferred.',
        url: 'https://example.com/jobs/machine-learning-engineer',
      },
      {
        title: 'Frontend Developer',
        description:
          'Looking for a frontend developer to build beautiful user interfaces. You will work with React, TypeScript, and modern CSS frameworks. Experience with state management and testing is required.',
        url: 'https://example.com/jobs/frontend-developer',
      },
      {
        title: 'Backend Developer',
        description:
          'We need a backend developer to build robust APIs and microservices. You will work with Node.js, Express, PostgreSQL, and Redis. Experience with GraphQL and message queues is a plus.',
        url: 'https://example.com/jobs/backend-developer',
      },
    ];
  }
}

export default new MockJobApi();
