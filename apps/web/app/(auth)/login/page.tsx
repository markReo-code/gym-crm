import React from "react";
import { LoginForm } from "../../../components/auth/LoginForm";
import Link from "next/link";

const LoginPage = () => {
  return (
    <div className="py-12">
      <div className="w-full max-w-[490px] mx-auto py-3 px-4 md:px-6">
        <h1 className="text-2xl font-semibold text-center mb-6">ログイン</h1>
        <p className=" text-sm text-center">
          メールアドレスとパスワードを入力してください
        </p>

        <LoginForm />

        <span className="block w-full text-center mt-4 ">
          新規会員登録
          <Link
            href="/signup"
            className="pl-2 text-muted-foreground underline underline-offset-2"
          >
            はじめてご利用の方はこちら
          </Link>
        </span>
      </div>
    </div>
  );
};

export default LoginPage;
