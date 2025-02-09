// MyErrorBoundary.tsx
import { isRouteErrorResponse, useRouteError } from 'react-router-dom';

export default function MyErrorBoundary() {
    const error = useRouteError();
    console.error('Caught by MyErrorBoundary:', error);

    if (isRouteErrorResponse(error)) {
        // e.g. 404 or a "Response" object from loader/action
        return <div>Oops, we couldn’t find that page!</div>;
    } else if (error instanceof Error) {
        // some other JS error
        return <div>Something went wrong: {error.message}</div>;
    } else {
        // fallback
        return <div>An unexpected error occurred.</div>;
    }
}
