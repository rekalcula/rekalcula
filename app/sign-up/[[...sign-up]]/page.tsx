// app/sign-up/[[...sign-up]]/page.tsx
import { SignUp } from '@clerk/nextjs';
import TermsAcceptance from '@/components/TermsAcceptance';

export default function SignUpPage() {
  const [termsAccepted, setTermsAccepted] = useState(false);

  return (
    <div>
      <TermsAcceptance
        isAccepted={termsAccepted}
        onAcceptanceChange={setTermsAccepted}
        showError={false}
      />
      
      {termsAccepted && (
        <SignUp 
          afterSignUpUrl="/onboarding"
          unsafeMetadata={{
            termsAccepted: true,
            termsAcceptedAt: new Date().toISOString(),
            termsVersion: '1.0'
          }}
        />
      )}
      
      {!termsAccepted && (
        <p className="text-center text-red-600">
          Debes aceptar los términos para continuar
        </p>
      )}
    </div>
  );
}