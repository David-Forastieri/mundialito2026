import RegisterClient from './RegisterClient'

interface Props {
  searchParams: Promise<{ invitacion?: string }>
}

export default async function RegisterPage({ searchParams }: Props) {
  const { invitacion } = await searchParams
  return <RegisterClient invitacion={invitacion} />
}
