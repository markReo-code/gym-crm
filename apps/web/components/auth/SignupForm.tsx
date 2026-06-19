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

  const onSubmit = async (values: SignupFormValues) => {
    try {
      setError("");
      await signUpWithEmail(values.name, values.email, values.password);
    } catch (error) {
      setError("ログインに失敗しました。入力内容を確認してください。");
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
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

      <Button type="submit" className="h-12 w-full text-base font-medium mt-10">
        {/* {isSubmitting ? "ログイン中..." : "ログインする"} */}
        新規登録する
      </Button>
    </form>
  );
};

export default SignupForm;
