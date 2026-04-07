/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "llm",
      removal: input?.stage === "production" ? "retain" : "remove",
      protect: ["production"].includes(input?.stage),
      home: "aws",
      region: "ap-southeast-1", // Singapore region for your RDS
    };
  },
  async run() {
    // 1. DNS (Explicitly create Hosted Zone so SST can find it for certificate validation)
    const zone = new aws.route53.Zone("LmsZone", { 
      name: "lebra.ai",
    });

    // 2. Secrets
    const dbUrl = new sst.Secret("DATABASE_URL");

    // 3. Networking (Public Subnets ONLY to avoid $32/mo NAT Gateway costs)
    const vpc = new sst.aws.Vpc("LmsVpc"); 

    // 4. Storage
    const bucket = new sst.aws.Bucket("LmsStorage", {
      public: true,
    });

    // 5. Transcription Task (Whisper)
    const cluster = new sst.aws.Cluster("TranscriptionCluster", { vpc });
    const whisperTask = cluster.addService("WhisperService", {
      cpu: "1 vCPU",
      memory: "4 GB",
      image: {
        context: "./whisper-service",
        dockerfile: "Dockerfile",
      },
      link: [bucket, dbUrl],
      environment: {
        DATABASE_URL: dbUrl.value,
        WHISPER_MODEL_SIZE: "base",
      },
      scaling: {
        min: 0,
        max: 1 // Keep it at 0 when not in use for max cost savings
      }
    });

    // 6. Next.js Main Application (Containerized via Fargate)
    const web = cluster.addService("LmsWeb", {
      cpu: "0.5 vCPU",
      memory: "1 GB",
      image: {
        context: ".",
        dockerfile: "Dockerfile",
      },
      link: [bucket, dbUrl],
      environment: {
        DATABASE_URL: dbUrl.value,
        NEXT_PUBLIC_S3_BUCKET: bucket.name,
        WHISPER_CLUSTER_NAME: cluster.nodes.cluster.name,
        WHISPER_SERVICE_NAME: whisperTask.nodes.service.name,
      },
      loadBalancer: {
        ports: [{ listen: "80/http", forward: "3000/http" }, { listen: "443/https", forward: "3000/http" }],
        domain: {
          name: "lebra.ai",
          dns: sst.aws.dns({
            zone: zone.id,
          }),
        },
      },
    });

    return {
      WebsiteUrl: web.url,
      S3BucketName: bucket.name,
      NameServers: zone.nameServers,
    };
  },
});
