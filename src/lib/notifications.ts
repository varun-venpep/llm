/**
 * AWS Notification Service Wrapper
 * 
 * To fully implement this, you must set the following ENV variables:
 * - AWS_ACCESS_KEY_ID
 * - AWS_SECRET_ACCESS_KEY
 * - AWS_REGION
 * 
 * Recommended Packages:
 * `npm install @aws-sdk/client-ses @aws-sdk/client-sns`
 */

export async function sendEmailNotification(to: string, subject: string, bodyHTML: string) {
    // Placeholder for AWS SES 'SendEmailCommand'
    console.log(`[SES Mock] Sending email to ${to}: ${subject}`);
    
    // Example SDK Usage:
    // const command = new SendEmailCommand({
    //     Destination: { ToAddresses: [to] },
    //     Message: {
    //         Body: { Html: { Charset: "UTF-8", Data: bodyHTML } },
    //         Subject: { Charset: "UTF-8", Data: subject }
    //     },
    //     Source: process.env.AWS_SES_FROM_ADDRESS
    // });
    // await sesClient.send(command);

    return true;
}

export async function sendPushNotification(userId: string, title: string, message: string) {
    // Placeholder for AWS SNS 'PublishCommand'
    console.log(`[SNS Mock] Sending push to User ${userId}: ${title} - ${message}`);
    
    // Example SDK Usage: 
    // const targetArn = await lookupUserSnsEndpoint(userId);
    // const command = new PublishCommand({ TargetArn: targetArn, Message: message });
    // await snsClient.send(command);

    return true;
}

export async function notifyCourseCompletion(userEmail: string, courseTitle: string) {
    const subject = `Congratulations on completing ${courseTitle}!`;
    const body = `<h1>Great job!</h1><p>You have successfully completed ${courseTitle}. Check your dashboard to download your certificate.</p>`;
    
    await sendEmailNotification(userEmail, subject, body);
}
