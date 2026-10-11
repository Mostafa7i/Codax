import React from "react";
import { X, Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const PasswordModal = ({
  showModal,
  closeModal,
  enteredPassword,
  setEnteredPassword,
  showPassword,
  setShowPassword,
  handlePasswordSubmit,
  isLoading,
  errorMessage,
}) => {
  if (!showModal) return null;

  return (
    <AnimatePresence>
      {showModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={closeModal}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                أدخل كلمة المرور
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-red-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={enteredPassword}
                  onChange={(e) => setEnteredPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handlePasswordSubmit()}
                  placeholder="كلمة المرور..."
                  className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  disabled={isLoading}
                  autoFocus
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-indigo-600"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {errorMessage && (
                <p className="text-red-600 dark:text-red-400 text-sm text-center font-medium">
                  {errorMessage}
                </p>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handlePasswordSubmit}
                  disabled={isLoading || !enteredPassword.trim()}
                  className="flex-1 py-3 bg-linear-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    "تأكيد"
                  )}
                </button>
                <button
                  onClick={closeModal}
                  className="flex-1 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default React.memo(PasswordModal);