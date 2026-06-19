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
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { loginWithEmail } from "../../lib/firebase/auth";
import { useState } from "react";
import { useRouter } from "next/navigation";
import PasswordVisibilityButton from "./PasswordVisibilityButton";

const loginSchema = z.object({
  email: z.email("メールアドレスの形式が正しくありません。"),
  password: z.string().min(1, "パスワードを入力してください。"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const LoginForm = () => {
  const router = useRouter();
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const isSubmitting = form.formState.isSubmitting;

  const onSubmit = async (values: LoginFormValues) => {
    try {
      setError("");
      await loginWithEmail(values.email, values.password);
      router.replace("/dashboard");
    } catch (error) {
      setError("ログインに失敗しました。入力内容を確認してください。");
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="mt-10">
      <FieldGroup className="gap-6">
        <Controller
          name="email"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field className="gap-2">
              <FieldLabel htmlFor={field.name} className="">
                メールアドレス
              </FieldLabel>
              <Input
                {...field}
                id={field.name}
                type="email"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && (
                <FieldError
                  errors={[fieldState.error]}
                  className="text-red-500"
                />
              )}
            </Field>
          )}
        />

        <Controller
          name="password"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel htmlFor={field.name} className="">
                パスワード
              </FieldLabel>
              <div className="relative">
                <Input
                  {...field}
                  id={field.name}
                  type={showPassword ? "text" : "password"}
                  aria-invalid={fieldState.invalid}
                  className="pr-10"
                />
                <PasswordVisibilityButton
                  isVisible={showPassword}
                  onClick={() => setShowPassword((current) => !current)}
                />
                {fieldState.invalid && (
                  <FieldError
                    errors={[fieldState.error]}
                    className="text-red-500"
                  />
                )}
              </div>
            </Field>
          )}
        />
      </FieldGroup>

      <Button type="submit" className="h-12 w-full text-base font-medium mt-10">
        {isSubmitting ? "ログイン中..." : "ログインする"}
      </Button>
    </form>
  );
};
