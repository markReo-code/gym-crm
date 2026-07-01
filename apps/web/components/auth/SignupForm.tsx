"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@repo/ui/components/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@repo/ui/components/field";
import { Input } from "@repo/ui/components/input";
import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import PasswordVisibilityButton from "./PasswordVisibilityButton";
import { signUpWithEmail } from "../../lib/firebase/auth";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { FirebaseError } from "firebase/app";

const signupSchema = z.object({
  name: z.string().trim().min(1, { message: "ユーザー名を入力してください。" }),
  email: z.email({ message: "適切なメールアドレスを入力してください。" }),
  password: z
    .string()
    .min(6, { message: "6文字以上で入力しください。" })
    .max(128, { message: "パスワードは128文字以内で入力してください。" }),
});

type SignupFormValues = z.infer<typeof signupSchema>;

const SignupForm = () => {
  const router = useRouter();
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  const isSubmitting = form.formState.isSubmitting;

  const onSubmit = async (values: SignupFormValues) => {
    try {
      setError("");

      const userCredential = await signUpWithEmail(
        values.name,
        values.email,
        values.password,
      );

      const idToken = await userCredential.user.getIdToken();

      const apiUrl = process.env.NEXT_PUBLIC_API_URL;

      if (!apiUrl) {
        throw new Error("NEXT_PUBLIC_API_URL is not set");
      }

      const response = await fetch(`${apiUrl}/users/me`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          name: values.name,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to sync user");
      }

      router.replace("/dashboard");
    } catch (error) {
      if (error instanceof FirebaseError) {
        switch (error.code) {
          case "auth/email-already-in-use":
            setError(
              "このメールアドレスは既に使用されています。ログインしてください。",
            );
            return;

          case "auth/invalid-email":
            setError("メールアドレスの形式が正しくありません。");
            return;

          case "auth/weak-password":
            setError("パスワードは6文字以上で入力してください。");
            return;
          case "auth/network-request-failed":
            setError(
              "ネットワークエラーが発生しました。通信環境を確認してください。",
            );
            return;
          default:
            setError(
              "新規登録に失敗しました。時間をおいて再度お試しください。",
            );
            return;
        }
      }

      setError("新規登録に失敗しました。入力内容を確認してください。");
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {error && (
        <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </p>
      )}
      <FieldGroup>
        <Controller
          name="name"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field className="gap-2">
              <FieldLabel htmlFor={field.name}>お名前</FieldLabel>
              <Input
                {...field}
                id={field.name}
                type="text"
                aria-invalid={fieldState.invalid}
                className="min-h-12"
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="email"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field className="gap-2">
              <FieldLabel htmlFor={field.name}>メールアドレス</FieldLabel>
              <Input
                {...field}
                id={field.name}
                type="email"
                aria-invalid={fieldState.invalid}
                className="min-h-12"
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="password"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field className="gap-2">
              <FieldLabel htmlFor={field.name}>パスワード</FieldLabel>
              <div className="relative">
                <Input
                  {...field}
                  id={field.name}
                  type={showPassword ? "text" : "password"}
                  aria-invalid={fieldState.invalid}
                  className="pr-10 min-h-12"
                />
                <PasswordVisibilityButton
                  isVisible={showPassword}
                  onClick={() => setShowPassword((current) => !current)}
                />
              </div>

              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </FieldGroup>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="h-12 w-full text-base font-medium mt-12"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            登録中...
          </>
        ) : (
          "新規登録する"
        )}
      </Button>
    </form>
  );
};

export default SignupForm;
