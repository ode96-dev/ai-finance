import { useState } from "react"
import { toast } from "sonner";

type AnyFn = (...args: any[]) => Promise<any>;

const useFetch = (cb: AnyFn) => {
    const [data, setData] = useState<any>(undefined)
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<unknown>(null)

    const fn = async (...args: any[]) => {
        setLoading(true)
        setError(null)

        try {
            const response = await cb(...args);
            setData(response);
            setError(null);

            return response;
        } catch (error: unknown) {
            setError(error)
            toast.error((error as Error)?.message || String(error))
            throw error
        } finally {
            setLoading(false)
        }

    }

    return { data, loading, error, fn, setData }
}

export default useFetch