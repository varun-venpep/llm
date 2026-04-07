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
    // 1. Secrets
    const dbUrl = new sst.Secret("DatabaseUrl");

    // 2. Networking (Public Subnets ONLY to avoid $32/mo NAT Gateway costs)
    const vpc = new sst.aws.Vpc("LmsVpc"); 

    // 3. Storage
    const bucket = new sst.aws.Bucket("LmsStorage", {
      public: true,
    });

    // 4. Transcription Task (Whisper)
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

    // 5. DNS & SSL (Route 53)
    const dns = sst.aws.dns.route53();

    // 6. Next.js Main Application
    const web = new sst.aws.Nextjs("LmsWeb", {
      vpc,
      link: [bucket, dbUrl],
      environment: {
        DATABASE_URL: dbUrl.value,
        NEXT_PUBLIC_S3_BUCKET: bucket.name,
        WHISPER_CLUSTER_NAME: cluster.nodes.cluster.name,
        WHISPER_SERVICE_NAME: whisperTask.nodes.service.name,
      },
      domain: {
        name: "lebra.ai",
        dns, 
      },
    });

    return {
      WebsiteUrl: web.url,
      S3BucketName: bucket.name,
      // You will copy these 4 values to GoDaddy
      NameServers: dns.nodes.zone.nameServers,
    };
  },
});
