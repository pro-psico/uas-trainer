export interface Question {
  id: number;
  tema: string;
  numero_pregunta: number;
  pregunta: string;
  respuestas_incorrectas: string[];
  respuesta_correcta: string;
}

export interface QuizQuestion extends Question {
  opciones: string[];
}

export interface QuestionAnswer {
  questionId: number;
  selectedAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  answeredAt: string;
}