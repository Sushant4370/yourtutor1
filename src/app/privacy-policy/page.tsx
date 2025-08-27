
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Read the YourTutor Privacy Policy to understand how we collect, use, and protect your personal information and data.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-secondary/50 py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
            <Card>
                <CardHeader className="text-center">
                    <Shield className="mx-auto h-12 w-12 text-primary mb-4" />
                    <CardTitle className="font-headline text-4xl md:text-5xl font-bold">Privacy Policy</CardTitle>
                    <p className="text-muted-foreground pt-2">Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </CardHeader>
                <CardContent className="prose prose-lg max-w-none text-card-foreground/90">
                    <p>
                        Welcome to YourTutor. We are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform.
                    </p>

                    <h2>1. Information We Collect</h2>
                    <p>We may collect information about you in a variety of ways. The information we may collect on the Site includes:</p>
                    <ul>
                        <li><strong>Personal Data:</strong> Personally identifiable information, such as your name, email address, and demographic information, that you voluntarily give to us when you register with the Site or when you choose to participate in various activities related to the Site, such as online chat and message boards.</li>
                        <li><strong>Tutor Application Data:</strong> If you apply to be a tutor, we collect additional information, including your bio, hourly rate, subjects, availability, and qualifications. This information is used to create your public profile and for our review process.</li>
                        <li><strong>Derivative Data:</strong> Information our servers automatically collect when you access the Site, such as your IP address, your browser type, your operating system, your access times, and the pages you have viewed directly before and after accessing the Site.</li>
                        <li><strong>Financial Data:</strong> Financial information, such as data related to your payment method (e.g. credit card brand, last four digits) that we may collect when you book a session. We store only very limited, if any, financial information that we collect. Otherwise, all financial information is stored by our payment processor, Stripe, and you are encouraged to review their privacy policy.</li>
                    </ul>

                    <h2>2. How We Use Your Information</h2>
                    <p>Having accurate information about you permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you via the Site to:</p>
                    <ul>
                        <li>Create and manage your account.</li>
                        <li>Process your payments and refunds.</li>
                        <li>Email you regarding your account or bookings.</li>
                        <li>Enable user-to-user communications.</li>
                        <li>Fulfill and manage bookings, payments, and other transactions related to the Site.</li>
                        <li>Generate a personal profile about you to make future visits to the Site more personalized.</li>
                        <li>Monitor and analyze usage and trends to improve your experience with the Site.</li>
                        <li>Notify you of updates to the Site.</li>
                        <li>Administer promotions and contests.</li>
                        <li>Prevent fraudulent transactions, monitor against theft, and protect against criminal activity.</li>
                    </ul>

                    <h2>3. Disclosure of Your Information</h2>
                    <p>We may share information we have collected about you in certain situations. Your information may be disclosed as follows:</p>
                    <ul>
                        <li><strong>By Law or to Protect Rights:</strong> If we believe the release of information about you is necessary to respond to legal process, to investigate or remedy potential violations of our policies, or to protect the rights, property, and safety of others, we may share your information as permitted or required by any applicable law, rule, or regulation.</li>
                        <li><strong>Third-Party Service Providers:</strong> We may share your information with third parties that perform services for us or on our behalf, including payment processing (Stripe), email delivery (Nodemailer with Gmail), file hosting (Cloudinary), and video conferencing (Zoom).</li>
                        <li><strong>Tutor Profiles:</strong> If you are a tutor, your name, subjects, bio, hourly rate, and avatar will be publicly visible to facilitate the booking process.</li>
                    </ul>

                    <h2>4. Security of Your Information</h2>
                    <p>
                        We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable, and no method of data transmission can be guaranteed against any interception or other type of misuse.
                    </p>

                    <h2>5. Policy for Children</h2>
                    <p>
                        We do not knowingly solicit information from or market to children under the age of 13. If you become aware of any data we have collected from children under age 13, please contact us using the contact information provided below.
                    </p>

                    <h2>6. Contact Us</h2>
                    <p>
                        If you have questions or comments about this Privacy Policy, please contact us through our <a href="/contact" className="text-primary underline">contact page</a>.
                    </p>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
