export declare class UploadController {
    private s3;
    constructor();
    uploadFile(file: Express.Multer.File): Promise<{
        url: string;
    }>;
}
