import React from "react";
import SignupForm from "../../../components/auth/SignupForm";
import Link from "next/link";

const SignupPage = () => {
  return (
    <div className="py-12">
      <div className="w-full max-w-[490px] mx-auto py-3 px-4 md:px-6">
        <h1 className="text-2xl font-semibold text-center mb-8">
          新規登録ページ
        </h1>

        <SignupForm />

        <span className="block w-full text-center mt-4 ">
          既にアカウントをお持ちですか？
          <Link
            href="/login"
            className="pl-2 text-muted-foreground underline underline-offset-2"
          >
            ログイン
          </Link>
        </span>
      </div>
    </div>
  );
};

export default SignupPage;
