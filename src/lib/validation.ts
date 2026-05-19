import type { ValidationResult } from "@/lib/types"

const GITLAB_ISSUE_PATH_PATTERN = /\/-\/issues\/new(?:\/)?$/i

export function validateGitLabIssueNewUrl(input: string): ValidationResult {
  if (!input.trim()) {
    return {
      isValid: false,
      message: "Enter a GitLab issue creation URL.",
    }
  }

  let parsedUrl: URL

  try {
    parsedUrl = new URL(input)
  } catch {
    return {
      isValid: false,
      message: "This is not a valid URL.",
    }
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    return {
      isValid: false,
      message: "Only HTTP and HTTPS URLs are supported.",
    }
  }

  if (!GITLAB_ISSUE_PATH_PATTERN.test(parsedUrl.pathname)) {
    return {
      isValid: false,
      message: "The URL must point to a GitLab new issue page ending in /-/issues/new.",
    }
  }

  return { isValid: true }
}

export function validateRelatedIssueId(value: string): ValidationResult {
  if (!value.trim()) {
    return { isValid: true }
  }

  return /^\d+$/.test(value.trim())
    ? { isValid: true }
    : {
        isValid: false,
        message: "Related issue ID must be numeric after variable replacement.",
      }
}
