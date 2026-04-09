# Whisper Transcription Service — AWS ECS Fargate Deployment Guide

## Overview
This service receives a video URL, transcribes the audio using `faster-whisper`, and POSTs the result back to the LMS webhook.

It relies on **FastAPI BackgroundTasks** to immediately return `HTTP 200 PROCESSING` to bypass Load Balancer timeouts while successfully crunching deep ML video logic.

---

## Step 1: ECR Build & Push

We now launch the infrastructure completely automatically within `template.yaml`. You simply need to build the Docker image natively for ARM64 and push it to the `llm-dev-whisper-repo`:

```bash
# Export the configurations
export AWS_ACCOUNT_ID=128353492796
export AWS_REGION=ap-southeast-1
export ECR_REPO=llm-dev-whisper-repo

# Login to your registry
aws ecr get-login-password --region $AWS_REGION | \
  docker login --username AWS --password-stdin \
  $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Build the native ARM64 image
docker buildx build --platform linux/arm64 -t $ECR_REPO --load .

# Tag & Push
docker tag $ECR_REPO:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO:latest
```

---

## Step 2: SAM Deploy

Once the image is firmly pushed to ECR:
```bash
sam build
sam deploy
```

This command natively launches:
1. `AWS::ECS::Service` on AWS Fargate (No hard 15-minute timeouts!)
2. `AWS::ElasticLoadBalancingV2::LoadBalancer` cleanly piping Port 80 to 10000.

---

## Step 3: Configure in LMS Settings

1. Find the resulting Load Balancer URL in the `sam deploy` Outputs (e.g., `http://llm-dev-whisper-alb-xxxx.ap-southeast-1.elb.amazonaws.com`)
2. Go to your tenant Super Admin → `/admin/settings`  
3. Under **AI Integrations**, paste your HTTP URL into the **Whisper AI URL** field.
4. Save

That's it! From now on, every VIDEO lesson upload automatically fires an ultra-resilient WebHook request strictly bypassing the old API restrictions.

---

## Cost Estimate
| Component | Cost |
|---|---|
| Lambda execution (4GB × 900s max) | ~$0.06 per video max |
| API Gateway | ~$0.001 per request |
| ECR Storage | ~$0.10/GB/month |
| **Real-world avg (5-min video)** | **~$0.01–0.02 per video** |
