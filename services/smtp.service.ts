
export interface MailPayload {
    from: string
    to: string | string[]
    cc?: string | string[]
    bcc?: string | string[]
    subject: string
    text?: string
    html?: string
}


export default class SMTPService {
    public static send() {

    }

    public static bulkSend() {

    }
}