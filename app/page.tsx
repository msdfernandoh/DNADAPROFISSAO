"use client"

import { useState } from "react"
import { Landing } from "@/components/dna/landing"
import { Registration } from "@/components/dna/registration"
import { Quiz } from "@/components/dna/quiz"
import { ThankYou } from "@/components/dna/thank-you"
import type { QuestionnaireType } from "@/lib/dna-data"

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

export default function DNAPage() {
  const [screen, setScreen] = useState<Screen>("landing")
  const [userData, setUserData] = useState<UserData | null>(null)
  const [participantId, setParticipantId] = useState<string | null>(null)
  const [quizType, setQuizType] = useState<QuestionnaireType>("completo")

  const onRegisterComplete = async (form: UserData, type: QuestionnaireType) => {
    setUserData(form)
    setQuizType(type)

    try {
      const response = await fetch("/api/participants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          email: form.email,
          city: form.city || null,
          course_interest: form.course || null,
          escolaridade: form.escolaridade,
          tipo_questionario: type,
        }),
      })
      const json = await response.json()
      if (response.ok && json.data?.id) {
        setParticipantId(json.data.id)
      } else {
        console.error("[v0] Erro ao criar participante:", json.error)
      }
    } catch (error) {
      console.error("[v0] Erro de rede ao criar participante:", error)
    }

    setScreen("quiz")
  }

  const onQuizComplete = async (result: QuizResult) => {
    if (!userData) return

    if (participantId) {
      try {
        await fetch("/api/participants", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: participantId,
            primary_profile: result.primary,
            secondary_profile: result.secondary,
            percentages: result.pct,
            tipo_questionario: quizType,
          }),
        })
      } catch (error) {
        console.error("[v0] Erro ao atualizar resultado:", error)
      }
    } else {
      try {
        await fetch("/api/participants", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: userData.name,
            phone: userData.phone,
            email: userData.email,
            city: userData.city || null,
            course_interest: userData.course || null,
            escolaridade: userData.escolaridade,
            tipo_questionario: quizType,
            primary_profile: result.primary,
            secondary_profile: result.secondary,
            percentages: result.pct,
          }),
        })
      } catch (error) {
        console.error("[v0] Erro no fallback de gravação:", error)
      }
    }

    setScreen("thankyou")
  }

  if (screen === "landing") {
    return <Landing onStart={() => setScreen("register")} />
  }

  if (screen === "register") {
    return <Registration onComplete={onRegisterComplete} />
  }

  if (screen === "quiz") {
    return <Quiz mode={quizType} onComplete={onQuizComplete} />
  }

  if (screen === "thankyou" && userData) {
    return <ThankYou name={userData.name.split(" ")[0]} />
  }

  return null
}
