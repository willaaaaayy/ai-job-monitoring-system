import Stripe from 'stripe';
import config from './config';
import logger from './logger';

if (!config.stripeSecretKey) {
  logger.warn('Stripe secret key not configured. Stripe features will be disabled.');
}

export const stripe = config.stripeSecretKey
  ? new Stripe(config.stripeSecretKey, {
      apiVersion: '2026-01-28.clover',
    })
  : null;

export const getStripeWebhookSecret = (): string => {
  if (!config.stripeWebhookSecret) {
    throw new Error('Stripe webhook secret not configured');
  }
  return config.stripeWebhookSecret;
};
