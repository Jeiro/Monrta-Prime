import React from "react";
import { motion } from "motion/react";
import { Mail, Phone } from "lucide-react";
import { useSiteSettings } from "../../context/domains/SiteSettingsContext";

export const ContactUs = () => {
  const { appSettings } = useSiteSettings();

  return (
    <section className="py-16 px-4 bg-ground/30" id="contact">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="max-w-4xl mx-auto text-center"
      >
        <h2 className="text-3xl md:text-5xl font-bold text-ink mb-6">Contact Us</h2>
        <p className="text-muted text-lg max-w-2xl mx-auto mb-12">Need help or have questions? Our support team is ready to assist you.</p>

        <div className="bg-surface border border-line p-8 rounded-2xl inline-flex flex-col items-center shadow-lg hover:border-accent/30 transition-all max-w-full">
          <Mail className="w-12 h-12 text-accent mx-auto mb-6" />
          <h3 className="font-bold text-xl text-ink mb-2">Email Support</h3>
          <a href={`mailto:${appSettings.supportEmail}`} className="text-accent hover:text-accent-hover text-lg transition-colors hover:underline break-all">{appSettings.supportEmail}</a>
          <div className="mt-6 flex items-center justify-center gap-2 text-faint">
            <Phone size={15} />
            <span>{appSettings.supportPhone}</span>
          </div>
          <p className="text-faint mt-2">24 Hours / 7 Days</p>
        </div>
      </motion.div>
    </section>
  );
};
