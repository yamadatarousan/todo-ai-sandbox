import type { FastifySchemaValidationError } from "fastify";

export type ErrorIssue = {
  field: string;
  message: string;
};

export type ErrorResponse = {
  issues?: ErrorIssue[];
  message: string;
  requestId: string;
};

export class ClientInputError extends Error {
  readonly issues: ErrorIssue[];

  constructor(message: string, options: { issues: ErrorIssue[] }) {
    super(message);
    this.name = "ClientInputError";
    this.issues = options.issues;
  }
}

export class ResourceNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ResourceNotFoundError";
  }
}

export const errorIssueResponseSchema = {
  additionalProperties: false,
  properties: {
    field: { type: "string" },
    message: { type: "string" },
  },
  required: ["field", "message"],
  type: "object",
} as const;

export const badRequestErrorResponseSchema = {
  additionalProperties: false,
  properties: {
    issues: {
      items: errorIssueResponseSchema,
      minItems: 1,
      type: "array",
    },
    message: { type: "string" },
    requestId: { type: "string" },
  },
  required: ["message", "requestId", "issues"],
  type: "object",
} as const;

export const internalServerErrorResponseSchema = {
  additionalProperties: false,
  properties: {
    message: { type: "string" },
    requestId: { type: "string" },
  },
  required: ["message", "requestId"],
  type: "object",
} as const;

export const notFoundErrorResponseSchema = {
  additionalProperties: false,
  properties: {
    message: { type: "string" },
    requestId: { type: "string" },
  },
  required: ["message", "requestId"],
  type: "object",
} as const;

export function createBadRequestErrorResponse(
  requestId: string,
  issues: ErrorIssue[],
): ErrorResponse {
  return {
    issues,
    message: "入力が不正です。",
    requestId,
  };
}

export function createInternalServerErrorResponse(
  requestId: string,
): ErrorResponse {
  return {
    message: "サーバーエラーが発生しました。",
    requestId,
  };
}

export function createNotFoundErrorResponse(
  requestId: string,
  message: string,
): ErrorResponse {
  return {
    message,
    requestId,
  };
}

export function mapValidationIssues(
  validationErrors: readonly FastifySchemaValidationError[],
): ErrorIssue[] {
  return validationErrors.map((validationError) => {
    const field = extractFieldName(validationError);

    return {
      field,
      message: createValidationIssueMessage(validationError, field),
    };
  });
}

function extractFieldName(validationError: FastifySchemaValidationError): string {
  const params = validationError.params as {
    missingProperty?: string;
  };

  if (typeof params.missingProperty === "string") {
    return params.missingProperty;
  }

  if (validationError.instancePath.length === 0) {
    return "body";
  }

  return validationError.instancePath.replace(/^\//u, "").replaceAll("/", ".");
}

function createValidationIssueMessage(
  validationError: FastifySchemaValidationError,
  field: string,
): string {
  const params = validationError.params as {
    limit?: number;
  };

  switch (validationError.keyword) {
    case "maxLength":
      if (typeof params.limit === "number") {
        return `${field} は ${params.limit} 文字以下である必要があります。`;
      }

      return `${field} が長すぎます。`;
    case "minLength":
    case "pattern":
      return `${field} は空文字を許可しません。`;
    case "required":
      return `${field} は必須です。`;
    case "type":
      return `${field} の型が不正です。`;
    default:
      return validationError.message ?? `${field} が不正です。`;
  }
}
