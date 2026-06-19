import React from "react";
import SignupForm from "../../../components/auth/SignupForm";

const SignupPage = () => {
  return (
    <div className="py-12">
      <div className="w-full max-w-[490px] mx-auto py-3 px-4 md:px-6">
        <h1 className="text-2xl font-semibold text-center mb-8">
          新規登録ページ
        </h1>

        <SignupForm />
      </div>
    </div>
  );
};

export default SignupPage;
