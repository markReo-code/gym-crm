import React from "react";
import { LoginForm } from "../../../components/auth/LoginForm";

const LoginPage = () => {
  return (
    <div className="py-12">
      <div className="w-full max-w-[490px] mx-auto py-3 px-4 md:px-6">
        <h1 className="text-2xl font-semibold text-center mb-6">
          ログインページ
        </h1>
        <p className=" text-sm text-center">
          メールアドレスとパスワードを入力してください
        </p>

        <LoginForm />
      </div>
    </div>
  );
};

export default LoginPage;
