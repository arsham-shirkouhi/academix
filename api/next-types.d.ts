// Type definitions for Next.js API types (for compatibility)
export interface NextApiRequest {
    method?: string;
    query: Record<string, string | string[]>;
    body: any;
    headers: Record<string, string | string[] | undefined>;
}

export interface NextApiResponse {
    statusCode: number;
    setHeader(key: string, value: string): void;
    status(code: number): NextApiResponse;
    json(data: any): void;
    end(data?: string): void;
}

