import { Redirect, useLocalSearchParams } from 'expo-router';

export default function TeaLegacyDetailRedirect() {
  const { id } = useLocalSearchParams<{ id?: string }>();

  if (!id) {
    return <Redirect href="/tea" />;
  }

  return <Redirect href={`/tea/post/${id}`} />;
}