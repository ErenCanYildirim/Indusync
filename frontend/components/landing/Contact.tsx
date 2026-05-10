"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Mail, Phone, MapPin } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

export function Contact() {
  const t = useTranslations("Contact");
  const [isSubmitting, setIsSubmitting] = useState(false); 
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    const formData = new FormData(e.currentTarget);

    const accessKey = process.env.NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY;

    if(!accessKey) {
      setSubmitStatus('error');
      setIsSubmitting(false);
      return; 
    }
    
    formData.append("access_key", accessKey);

    formData.append("subject", "New Contact Form Submission");
    formData.append("from_name", "Your Website Contact Form");

    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: formData 
      });

      const data = await response.json();

      if (data.success) {
        setSubmitStatus('success'); 
        (e.target as HTMLFormElement).reset(); 
      } else {
        throw new Error(data.message || 'Something went wrong');
      }
    } catch (error) {
      console.error('Form submission error:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="py-20 bg-white" id="kontakt">
      <div className="container">
        <div className="grid md:grid-cols-2 gap-12">
          <div>
            <h2 className="text-3xl font-bold mb-6">{t("title")}</h2>
            <div className="w-20 h-1 bg-primary mb-8"></div>
            <p className="text-zinc-600 mb-8">{t("description")}</p>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-full bg-primary/10 text-primary">
                  <MapPin className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-zinc-900 mb-1">
                    {t("headquarters")}
                  </h3>
                  <p className="text-zinc-600">
                    {t("addressLine2")}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 rounded-full bg-primary/10 text-primary">
                  <Phone className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-zinc-900 mb-1">{t("phone")}</h3>
                  <p className="text-zinc-600">{t("phoneNumber")}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 rounded-full bg-primary/10 text-primary">
                  <Mail className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-zinc-900 mb-1">{t("email")}</h3>
                  <p className="text-zinc-600">{t("emailAddress")}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-zinc-50 p-8 rounded-xl">
            <h3 className="text-xl font-bold mb-6">{t("sendMessageTitle")}</h3>

            {/* Success message */}
            {submitStatus === 'success' && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
                  {t("successMessage") || "Message sent successfully! We'll get back to you soon."}
                </div>
            )}

            {/* Error message */}
            {submitStatus === 'error' && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
                  {t("errorMessage") || "Failed to send message. Please try again."}
                </div>
            )}

            <form className="space-y-6" onSubmit={handleSubmit} suppressHydrationWarning>
              <div>
                  <Label htmlFor="name" className="text-zinc-900">
                    {t("nameLabel")}
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder={t("namePlaceholder")}
                    className="mt-2"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email" className="text-zinc-900">
                    {t("emailLabel")}
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder={t("emailPlaceholder")}
                    className="mt-2"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="message" className="text-zinc-900">
                    {t("messageLabel")}
                  </Label>
                  <Textarea
                    id="message"
                    name="message"
                    placeholder={t("messagePlaceholder")}
                    className="mt-2 min-h-[120px]"
                    required
                  />
                </div>

                <input type="hidden" name="botcheck" className="hidden" />

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50"
                >
                  {isSubmitting
                    ? (t("sendingButton") || "Sending...") 
                    : (t("sendMessageButton") || "Send Message")
                  }
                </Button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}