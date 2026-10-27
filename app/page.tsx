"use client"

import { useEffect, useState } from "react"
import { Landing } from "@/components/dna/landing"
import { Registration } from "@/components/dna/registration"
import { Quiz } from "@/components/dna/quiz"
import { ThankYou } from "@/components/dna/thank-you"
import type { QuestionnaireType } from "@/lib/dna-data"
import { DEFAULT_DNA_RAPIDO_QUESTION_INDICES } from "@/lib/app-settings"
import { normalizeVendorSlug } from "@/lib/vendor-utils"
import { registerParticipant, completeParticipant } from "@/lib/questionnaire-platform/participant-persistence"

type Screen = "landing" | "register" | "quiz" | "thankyou"

interface UserData {
  name: string
  phone: string
  email: string
  city: string
  course: string
  escolaridade: string
}

interface QuizResult {
  primary: string
  secondary: string
  counts: Record<string, number>
  pct: Record<string, number>
}

export interface VendorContact {
  name: string
  slug: string
  phone: string
}

const VENDOR_STORAGE_KEY = "dna_vendor_slug"

export default function DNAPage() {
  const [screen, setScreen] = useState<Screen>("landing")
  const [userData, setUserData] = useState<UserData | null>(null)
  const [participantId, setParticipantId] = useState<string | null>(null)
  const [quizType, setQuizType] = useState<QuestionnaireType>("completo")
  const [vendorSlug, setVendorSlug] = useState<string | null>(null)
  const [vendorContact, setVendorContact] = useState<VendorContact | null>(null)
  const [publicSettings, setPublicSettings] = useState({
    dnaRapidoEnabled: false,
    quickQuestionIndices: [...DEFAULT_DNA_RAPIDO_QUESTION_INDICES] as number[],
    loaded: false,
  })

  useEffect(() => {
    fetch("/api/settings/public")
      .then(r => r.json())
      .then(j => {
        setPublicSettings({
          dnaRapidoEnabled: !!j.dnaRapidoEnabled,
          quickQuestionIndices: Array.isArray(j.quickQuestionIndices)
            ? j.quickQuestionIndices
            : [...DEFAULT_DNA_RAPIDO_QUESTION_INDICES],
          loaded: true,
        })
      })
      .catch(() =>
        setPublicSettings(s => ({
          ...s,
          loaded: true,
        }))
      )
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const fromUrl = params.get("v") || params.get("ref")
    if (fromUrl) {
      const slug = normalizeVendorSlug(fromUrl)
      if (slug) {
        setVendorSlug(slug)
        try {
          sessionStorage.setItem(VENDOR_STORAGE_KEY, slug)
        } catch {
          /* ignore */
        }
        return
      }
    }
    try {
      const stored = sessionStorage.getItem(VENDOR_STORAGE_KEY)
      if (stored) setVendorSlug(normalizeVendorSlug(stored) || null)
    } catch {
      /* ignore */
    }
  }, [])

  const onRegisterComplete = async (form: UserData, type: QuestionnaireType) => {
    setUserData(form)
    setQuizType(type)

    const id = await registerParticipant({
      name: form.name, phone: form.phone, email: form.email, city: form.city || null,
      course_interest: form.course || null, escolaridade: form.escolaridade,
      tipo_questionario: type, vendor_slug: vendorSlug,
    })
    setParticipantId(id)

    setScreen("quiz")
  }

  const onQuizComplete = async (result: QuizResult) => {
    if (!userData) throw new Error("Seu cadastro ainda não foi confirmado. Suas respostas continuam nesta tela.")

    await completeParticipant(participantId, {
      primary_profile: result.primary, secondary_profile: result.secondary,
      percentages: result.pct, tipo_questionario: quizType,
    })

    if (vendorSlug) {
      try {
        const res = await fetch(`/api/vendors/public?slug=${encodeURIComponent(vendorSlug)}`)
        const json = await res.json()
        if (json.vendor) {
          setVendorContact(json.vendor)
        }
      } catch {
        /* sem vendedor */
      }
    }

    setScreen("thankyou")
  }

  if (screen === "landing") {
    return <Landing onStart={() => setScreen("register")} />
  }

  if (screen === "register") {
    return (
      <Registration
        onComplete={onRegisterComplete}
        dnaRapidoEnabled={publicSettings.dnaRapidoEnabled}
        settingsLoaded={publicSettings.loaded}
      />
    )
  }

  if (screen === "quiz") {
    return (
      <Quiz
        mode={quizType}
        quickQuestionIndices={
          quizType === "rapido" ? publicSettings.quickQuestionIndices : undefined
        }
        onComplete={onQuizComplete}
      />
    )
  }

  if (screen === "thankyou" && userData) {
    return (
      <ThankYou name={userData.name.split(" ")[0]} vendor={vendorContact} />
    )
  }

  return null
}
