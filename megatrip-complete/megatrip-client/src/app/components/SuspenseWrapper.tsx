import { Suspense, ComponentType } from 'react';

export function withSuspense<P extends object>(Component: ComponentType<P>) {
    return function WrappedComponent(props: P) {
        return (
            <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
                <Component {...props} />
            </Suspense>
        );
    };
}