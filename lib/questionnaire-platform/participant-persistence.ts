type Fetcher = (input: string, init: RequestInit) => Promise<Response>;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
async function persist(method: 'POST' | 'PATCH', payload: Record<string, unknown>, expectedId?: string, fetcher: Fetcher = fetch): Promise<string> {
    let response: Response;
    try {
        response = await fetcher('/api/participants', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    }
    catch {
        throw new Error('Não foi possível confirmar a gravação. Seus dados continuam nesta tela; tente novamente quando a conexão voltar.');
    }
    let body: {
        success?: boolean;
        data?: {
            id?: string;
        };
    };
    try {
        body = await response.json();
    }
    catch {
        throw new Error('O servidor não confirmou a gravação. Seus dados continuam nesta tela.');
    }
    const id = body?.data?.id;
    if (!response.ok || body?.success !== true || typeof id !== 'string' || !UUID.test(id) || (expectedId !== undefined && id !== expectedId))
        throw new Error('A gravação não foi confirmada. Revise a conexão e tente novamente nesta mesma tela.');
    return id;
}
export function registerParticipant(payload: Record<string, unknown>, fetcher?: Fetcher) { return persist('POST', payload, undefined, fetcher); }
export function completeParticipant(id: string | null, payload: Record<string, unknown>, fetcher?: Fetcher) {
    if (!id || !UUID.test(id))
        return Promise.reject(new Error('O cadastro ainda não foi confirmado. Não é possível concluir a avaliação.'));
    return persist('PATCH', { ...payload, id }, id, fetcher);
}
