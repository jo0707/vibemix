"use server"

export async function generateVideo(): Promise<{ success: boolean; error?: string }> {
    return { success: false, error: "Use Electron API for video generation" }
}

export async function getProjectNameSuggestion(): Promise<{ suggestion: string }> {
    return { suggestion: `Project_${Date.now()}` }
}
