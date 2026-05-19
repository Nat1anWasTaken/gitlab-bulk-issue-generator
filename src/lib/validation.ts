import type { ValidationResult } from "@/lib/types"

const GITLAB_ISSUE_PATH_PATTERN = /\/-\/issues\/new(?:\/)?$/i

export function validateGitLabIssueNewUrl(input: string): ValidationResult {
  if (!input.trim()) {
    return {
      isValid: false,
      message: "請輸入 GitLab 卡片建立 URL。",
    }
  }

  let parsedUrl: URL

  try {
    parsedUrl = new URL(input)
  } catch {
    return {
      isValid: false,
      message: "這不是有效的 URL。",
    }
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    return {
      isValid: false,
      message: "僅支援 HTTP 和 HTTPS URL。",
    }
  }

  if (!GITLAB_ISSUE_PATH_PATTERN.test(parsedUrl.pathname)) {
    return {
      isValid: false,
      message: "URL 必須指向以 /-/issues/new 結尾的 GitLab 新卡片頁面。",
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
        message: "關聯卡片 ID 在替換變數後必須為數字。",
      }
}
