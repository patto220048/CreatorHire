// app/(dashboard)/creator/jobs/new/page.tsx
// Server Page hiển thị Form đăng tin tuyển dụng mới cho Creator

import NewJobForm from "@/components/dashboard/new-job-form";

export default function NewJobPage() {
  return (
    <div className="py-6">
      <NewJobForm />
    </div>
  );
}
