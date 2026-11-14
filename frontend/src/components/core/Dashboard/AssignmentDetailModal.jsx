import PropTypes from "prop-types";
import { FiX } from "react-icons/fi";
import AssignmentDetail from "./AssignmentDetail";
export default function AssignmentDetailModal({
  assignmentId,
  onClose
}) {
  if (!assignmentId) return null;
  return <div className="fixed inset-0 z-[1000] !mt-0 grid h-screen w-screen place-items-center overflow-auto bg-white bg-opacity-10 backdrop-blur-sm" onClick={onClose}>
      <div className="my-10 w-11/12 max-w-5xl rounded-2xl border border-slate-600/50 bg-richblack-900" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-end p-4">
          <button onClick={onClose} className="text-slate-300 hover:text-white transition-colors" aria-label="Close" type="button">
            <FiX size={22} />
          </button>
        </div>
        <div className="px-4 pb-6">
          <AssignmentDetail assignmentIdProp={assignmentId} inModal onClose={onClose} />
        </div>
      </div>
    </div>;
}
AssignmentDetailModal.propTypes = {
  "assignmentId": PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  "onClose": PropTypes.func
};
