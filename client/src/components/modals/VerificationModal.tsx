import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { VerificationQuestion } from "@/lib/types";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerify: (answers: number[]) => Promise<{ verified: boolean; message: string }>;
  questions: VerificationQuestion[];
  bookTitle: string;
}

const VerificationModal: React.FC<VerificationModalProps> = ({
  isOpen,
  onClose,
  onVerify,
  questions = [],
  bookTitle,
}) => {
  const [answers, setAnswers] = useState<number[]>(() => questions?.map(() => -1) || []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    verified: boolean;
    message: string;
  } | null>(null);

  const handleAnswerChange = (questionIndex: number, answerIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[questionIndex] = answerIndex;
    setAnswers(newAnswers);
  };

  const handleSubmit = async () => {
    if (answers.some((a) => a === -1)) {
      setVerificationResult({
        verified: false,
        message: "Please answer all questions before submitting",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await onVerify(answers);
      setVerificationResult(result);
      
      if (result.verified) {
        // Auto-close after successful verification
        setTimeout(() => {
          handleClose();
        }, 2000);
      }
    } catch (error) {
      setVerificationResult({
        verified: false,
        message: "An error occurred during verification",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setAnswers(questions?.map(() => -1) || []);
    setVerificationResult(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-serif font-bold text-neutral-800">
            Verify Your Reading
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-2">
          <p className="text-neutral-600 mb-5">
            Please answer these questions to verify that you've read "{bookTitle}" before leaving a review.
          </p>

          {verificationResult && (
            <Alert
              className={`mb-4 ${
                verificationResult.verified ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
              }`}
            >
              {verificationResult.verified ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription>{verificationResult.message}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-6">
            {questions.map((question, questionIndex) => (
              <div key={questionIndex} className="space-y-3">
                <h4 className="font-medium text-neutral-800">
                  {questionIndex + 1}. {question.question}
                </h4>
                <RadioGroup
                  value={answers[questionIndex]?.toString() || ""}
                  onValueChange={(value) =>
                    handleAnswerChange(questionIndex, parseInt(value))
                  }
                  className="space-y-2"
                >
                  {question.options?.map((option, optionIndex) => (
                    <div className="flex items-center space-x-2" key={optionIndex}>
                      <RadioGroupItem
                        value={optionIndex.toString()}
                        id={`q${questionIndex}a${optionIndex}`}
                      />
                      <Label htmlFor={`q${questionIndex}a${optionIndex}`} className="cursor-pointer">
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || verificationResult?.verified}
            className="w-full"
          >
            {isSubmitting
              ? "Verifying..."
              : verificationResult?.verified
              ? "Verified Successfully!"
              : "Verify & Continue"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default VerificationModal;
