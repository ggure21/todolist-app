import { useQuery } from '@tanstack/react-query';
import { userApi } from '../api/user.api';
import { Layout } from '../components/Layout';
import { QUERY_KEYS } from '../constants/queryKeys.constants';
import { ProfileForm } from '../features/user/ProfileForm';
import { useAuthStore } from '../stores/authStore';

function ProfilePage() {
  const accessToken = useAuthStore((s) => s.accessToken);

  const { data: profile, isLoading } = useQuery({
    queryKey: QUERY_KEYS.user.me,
    queryFn: () => userApi.getMe(),
    enabled: !!accessToken,
  });

  return (
    <Layout>
      <div className="max-w-lg mx-auto px-4 py-8">
        <h1 className="text-lg font-semibold text-[var(--color-gray-900)] mb-6">프로필 설정</h1>

        {isLoading && (
          <div
            role="status"
            aria-label="로딩 중"
            className="flex items-center justify-center py-10 text-sm text-[var(--color-gray-500)]"
          >
            <span
              className="inline-block w-5 h-5 border-2 border-[var(--color-primary-600)] border-t-transparent rounded-full animate-spin mr-2"
              aria-hidden="true"
            />
            불러오는 중...
          </div>
        )}

        {profile && (
          <div className="bg-[var(--color-bg-base)] border border-[var(--color-border)] rounded-lg p-6 shadow-[var(--shadow-sm)]">
            <ProfileForm profile={profile} />
          </div>
        )}
      </div>
    </Layout>
  );
}

export default ProfilePage;
