/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * EnrollmentModal: Biometric Enrollment Module
 * Automatically enrolls reference images and generates 128-d FaceAPI descriptors.
 * Stores: UUID, Full Name, Profile Photo, Face Descriptor, Created Date, Last Login.
 */

import React, { useState } from 'react';
import {
  UserPlus,
  Upload,
  CheckCircle2,
  AlertTriangle,
  X,
  Trash2,
  Cpu,
  Calendar,
  Clock,
  Shield,
  Loader2,
} from 'lucide-react';
import { enrollmentStore } from '../../auth/enrollmentStore';
import { EnrolledUser } from '../../auth/types';
import { StaffRole, ROLE_LABELS } from '../../types/venue';
import { playClickSound, playSuccessChime, playWarningBuzzer } from '../../utils/audio';

interface EnrollmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEnrollmentSuccess?: (user: EnrolledUser) => void;
}

export const EnrollmentModal: React.FC<EnrollmentModalProps> = ({
  isOpen,
  onClose,
  onEnrollmentSuccess,
}) => {
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<StaffRole>('volunteers');
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [enrolledList, setEnrolledList] = useState<EnrolledUser[]>(() =>
    enrollmentStore.getEnrolledUsers()
  );

  if (!isOpen) return null;

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    setSuccessMsg(null);

    const reader = new FileReader();
    reader.onload = () => {
      setPreviewPhoto(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleEnrollSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!fullName.trim()) {
      setErrorMsg('Please enter a full name for biometric enrollment.');
      return;
    }

    if (!previewPhoto) {
      setErrorMsg('Please upload a clear reference photo.');
      return;
    }

    setIsProcessing(true);
    playClickSound();

    try {
      const enrolled = await enrollmentStore.enrollUser({
        fullName: fullName.trim(),
        profilePhoto: previewPhoto,
        role,
      });

      playSuccessChime();
      setSuccessMsg(`Successfully enrolled ${enrolled.fullName} as ${ROLE_LABELS[role]?.title || role}! 128-d face descriptor computed.`);
      setEnrolledList(enrollmentStore.getEnrolledUsers());
      setFullName('');
      setPreviewPhoto(null);

      if (onEnrollmentSuccess) {
        onEnrollmentSuccess(enrolled);
      }
    } catch (err) {
      playWarningBuzzer();
      const message = err instanceof Error ? err.message : 'Biometric enrollment failed.';
      setErrorMsg(message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteUser = (id: string, name: string) => {
    playClickSound();
    if (confirm(`Remove biometric profile for ${name}?`)) {
      enrollmentStore.deleteUser(id);
      setEnrolledList(enrollmentStore.getEnrolledUsers());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[92vh] bg-[#120F0D] border border-[#B08D57]/60 rounded-xs shadow-[0_20px_60px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#B08D57]/30 bg-[#0E0C0A] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xs bg-[#241A14] border border-[#B08D57]/50 flex items-center justify-center text-[#E5C578]">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h2
                className="text-sm font-bold uppercase tracking-[0.2em] text-[#F5F2EA] font-serif"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                Biometric Face Enrollment
              </h2>
              <p className="text-[10px] text-[#B08D57] font-serif">
                Upload reference photo to compute 128-dimensional FaceAPI descriptor
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-xs text-[#B08D57] hover:text-[#F5F2EA] hover:bg-[#1E1814] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* New Enrollment Form */}
          <form onSubmit={handleEnrollSubmit} className="p-4 rounded-xs bg-[#161210] border border-[#B08D57]/40 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#B08D57]/20">
              <span
                className="text-xs uppercase tracking-wider text-[#E5C578] font-bold font-serif"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                Enroll New Biometric Reference
              </span>
              <span className="text-[9px] font-mono text-[#B08D57] uppercase">
                TinyFaceDetector + FaceRecognitionNet
              </span>
            </div>

            {errorMsg && (
              <div className="p-2.5 rounded-xs bg-red-950/70 border border-red-500/50 text-red-200 text-xs flex items-start gap-2 font-serif">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-2.5 rounded-xs bg-emerald-950/70 border border-emerald-500/50 text-emerald-200 text-xs flex items-start gap-2 font-serif">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-[#CFC7B4] font-serif mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Fahad Al Kednd"
                  className="w-full bg-[#0A0908] border border-[#B08D57]/40 rounded-xs px-3 py-2 text-sm text-[#F5F2EA] placeholder-[#6E5D4A] focus:outline-none focus:border-[#E5C578] font-serif"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-[#CFC7B4] font-serif mb-1.5">
                  Department / Assigned Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as StaffRole)}
                  className="w-full bg-[#0A0908] border border-[#B08D57]/40 rounded-xs px-3 py-2 text-sm text-[#F5F2EA] focus:outline-none focus:border-[#E5C578] font-serif cursor-pointer"
                >
                  <option value="volunteers">Volunteers (Pass Holder)</option>
                  <option value="media_and_press">Media & Press (Pass Holder)</option>
                  <option value="dcc">DCC (Pass Holder)</option>
                  <option value="marketing">Marketing (Pass Holder)</option>
                  <option value="designers">Design (Pass Holder)</option>
                  <option value="executive">Executive Board (Pass Holder)</option>
                  <option value="logistics">Logistics (Pass Holder)</option>
                  <option value="pr">Public Relations (Pass Holder)</option>
                  <option value="hr">Human Resources (HR) (Pass Holder)</option>
                  <option value="ceremonies">Ceremonies (Pass Holder)</option>
                  <option value="security">Security (Scanner Authorized)</option>
                  <option value="it">IT & Systems (Scanner Authorized)</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs uppercase tracking-wider text-[#CFC7B4] font-serif mb-1.5">
                  Reference Portrait Photo
                </label>
                <label className="flex items-center justify-center gap-2 w-full bg-[#0A0908] hover:bg-[#1A1410] border border-dashed border-[#B08D57]/50 rounded-xs px-3 py-2 text-xs text-[#E5C578] cursor-pointer transition font-serif">
                  <Upload className="w-4 h-4 text-[#B08D57]" />
                  <span>{previewPhoto ? 'Change Reference Photo' : 'Select Photo File'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Photo Preview and Descriptor Generation Alert */}
            {previewPhoto && (
              <div className="flex items-center gap-3 p-2.5 bg-[#0C0A09] rounded-xs border border-[#B08D57]/30">
                <img
                  src={previewPhoto}
                  alt="Reference Preview"
                  className="w-14 h-14 rounded-xs object-cover border border-[#B08D57]/60"
                />
                <div className="text-xs font-serif text-[#CFC7B4]">
                  <p className="font-semibold text-[#E5C578]">Reference photo ready for FaceAPI</p>
                  <p className="text-[11px] text-[#A89F91]">
                    Submitting will run TinyFaceDetector to locate landmarks and generate the 128-dimensional embedding.
                  </p>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isProcessing}
              className="w-full py-2 px-4 rounded-xs bg-gradient-to-r from-[#8C673B] via-[#B08D57] to-[#8C673B] hover:from-[#A67C48] hover:via-[#C5A059] hover:to-[#A67C48] disabled:opacity-50 text-[#0A0908] font-bold text-xs uppercase tracking-[0.2em] transition cursor-pointer shadow-md flex items-center justify-center gap-2 font-serif border border-[#E5C578]/60"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Computing FaceAPI Descriptor...</span>
                </>
              ) : (
                <>
                  <Cpu className="w-3.5 h-3.5" />
                  <span>Enroll Profile & Compute Descriptor</span>
                </>
              )}
            </button>
          </form>

          {/* Currently Enrolled Users Registry */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span
                className="text-xs font-bold uppercase tracking-[0.2em] text-[#E5C578] font-serif"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                Enrolled Biometric Profiles ({enrolledList.length})
              </span>
              <span className="text-[10px] text-[#B08D57] font-mono">
                FaceAPI 128-d Descriptors
              </span>
            </div>

            {enrolledList.length === 0 ? (
              <div className="p-6 text-center text-xs text-neutral-400 font-serif border border-dashed border-[#B08D57]/30 rounded-xs">
                No users currently enrolled. Provide a reference image above to enroll.
              </div>
            ) : (
              <div className="space-y-2.5">
                {enrolledList.map((user) => (
                  <div
                    key={user.id}
                    className="p-3 bg-[#161210] border border-[#B08D57]/30 rounded-xs flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={user.profilePhoto}
                        alt={user.fullName}
                        className="w-11 h-11 rounded-xs object-cover border border-[#B08D57]/60 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4
                            className="text-xs font-bold text-[#F5F2EA] uppercase tracking-wider font-serif truncate"
                            style={{ fontFamily: "'Cinzel', serif" }}
                          >
                            {user.fullName}
                          </h4>
                          <span className="text-[9px] uppercase px-1.5 py-0.2 rounded-xs bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-mono">
                            Enrolled
                          </span>
                        </div>
                        <div className="text-[10px] text-[#B08D57] font-mono truncate">
                          UUID: {user.id}
                        </div>
                        <div className="text-[10px] text-neutral-400 font-serif flex items-center gap-3 mt-0.5">
                          <span className="flex items-center gap-1">
                            <Cpu className="w-3 h-3 text-[#B08D57]" />
                            <span>128-d Vector</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-[#B08D57]" />
                            <span>
                              {user.lastLogin
                                ? `Last active ${new Date(user.lastLogin).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                                : 'Awaiting first login'}
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteUser(user.id, user.fullName)}
                      className="p-1.5 text-neutral-500 hover:text-red-400 transition cursor-pointer rounded-xs shrink-0"
                      title="Delete enrolled profile"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-2.5 border-t border-[#B08D57]/30 bg-[#0E0C0A] flex items-center justify-between text-[10px] text-[#B08D57] font-serif">
          <span>Western Model United Nations • Biometric Verification System</span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-xs bg-[#1E1814] hover:bg-[#28201A] text-[#E5C578] uppercase tracking-wider transition cursor-pointer font-serif border border-[#B08D57]/40"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
