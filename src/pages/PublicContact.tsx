import React from "react";
import { Mail, Clock, MapPin, Phone } from "lucide-react";
import { motion } from "motion/react";
import { useSiteSettings } from "../context/domains/SiteSettingsContext";

const PublicContact = () => {
  const { appSettings } = useSiteSettings();

  return (
    <div className="min-h-screen bg-ground text-ink pt-32 pb-24 px-4 font-sans">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-6 text-ink tracking-tight">Contact Us</h1>
        <p className="text-muted text-lg mb-16 max-w-2xl mx-auto">We are here to help. Reach out to us anytime and our support team will get back to you as soon as possible.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-surface border border-line p-8 rounded-2xl flex flex-col items-center text-center shadow-lg hover:border-accent/30 transition-all"
        >
          <Mail className="w-12 h-12 text-accent mb-6" />
          <h3 className="font-bold text-xl mb-2">Email Support</h3>
          <a href={`mailto:${appSettings.supportEmail}`} className="text-accent hover:text-accent-hover transition-colors break-all">{appSettings.supportEmail}</a>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-surface border border-line p-8 rounded-2xl flex flex-col items-center text-center shadow-lg hover:border-accent/30 transition-all"
        >
          <Phone className="w-12 h-12 text-accent mb-6" />
          <h3 className="font-bold text-xl mb-2">Support Phone</h3>
          <p className="text-muted">{appSettings.supportPhone}</p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-surface border border-line p-8 rounded-2xl flex flex-col items-center text-center shadow-lg hover:border-accent/30 transition-all"
        >
          <MapPin className="w-12 h-12 text-accent mb-6" />
          <h3 className="font-bold text-xl mb-2">Company Address</h3>
          <p className="text-muted">{appSettings.companyAddress}</p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-surface border border-line p-8 rounded-2xl flex flex-col items-center text-center shadow-lg hover:border-accent/30 transition-all"
        >
          <Clock className="w-12 h-12 text-accent mb-6" />
          <h3 className="font-bold text-xl mb-2">Support Hours</h3>
          <p className="text-muted">24 Hours / 7 Days</p>
        </motion.div>
      </div>
    </div>
  );
};

export default PublicContact;
