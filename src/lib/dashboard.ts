import { getSubmissionsCollection } from "@/lib/mongodb"
import { mapMongoDocuments } from "@/lib/mongodb"

export async function getApprovedEmails(): Promise<string[]> {
  try {
    // Fetch approved emails from MongoDB submissions
    const submissionsCollection = await getSubmissionsCollection()
    const approvedSubmissions = await submissionsCollection
      .find({ status: "Successful" })
      .project({ customerEmail: 1 })
      .toArray()
    
    return approvedSubmissions.map((submission) => submission.customerEmail)
  } catch (error) {
    console.error("Error fetching approved emails:", error)
    return []
  }
} 