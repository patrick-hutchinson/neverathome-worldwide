import { handleUpload } from "@vercel/blob/client";

import { applicationUploadFields } from "@/lib/applicationFormConfig";

const uploadFieldMap = new Map(applicationUploadFields.map((field) => [field.name, field]));

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "Method not allowed." });
  }

  try {
    const jsonResponse = await handleUpload({
      body: request.body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const payload = clientPayload ? JSON.parse(clientPayload) : {};
        const field = uploadFieldMap.get(payload.fieldName);

        if (!field) {
          throw new Error("Unknown upload field.");
        }

        return {
          allowedContentTypes: field.allowedContentTypes,
          maximumSizeInBytes: field.maxBytes,
          tokenPayload: JSON.stringify({
            fieldName: field.name,
            submissionId: payload.submissionId,
          }),
        };
      },
      onUploadCompleted: async () => {},
    });

    return response.status(200).json(jsonResponse);
  } catch (error) {
    return response.status(400).json({ error: error.message || "Upload failed." });
  }
}
