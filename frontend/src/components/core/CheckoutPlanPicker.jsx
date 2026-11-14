import PropTypes from 'prop-types';
import { FiCheck, FiCreditCard, FiArrowRight, FiLayers } from 'react-icons/fi';

export default function CheckoutPlanPicker({ plans, value, onChange, price }) {
  const selected = plans.find(plan => plan.activation_code === value);
  const unlimited = plan => String(plan.courses.remaining).toLowerCase() === 'unlimited';
  return <fieldset className="space-y-3">
    <legend className="mb-1 text-sm font-semibold text-richblack-5">Use your membership</legend>
    <p className="text-xs leading-relaxed text-richblack-300">Choose a plan to cover this course.</p>
    <div className="space-y-3">
      {plans.map(plan => {
        const active = value === plan.activation_code;
        const remaining = Number(plan.courses.remaining);
        const total = Number(plan.courses.total);
        const percent = unlimited(plan) ? 100 : total > 0 ? Math.min(100, Math.max(0, remaining / total * 100)) : 0;
        return <label key={plan.activation_code} className="group relative block cursor-pointer">
          <input type="radio" name="checkout-plan" value={plan.activation_code} checked={active} onChange={() => onChange(plan.activation_code)} aria-label={`${plan.plan_name} plan`} className="peer sr-only" />
          <div className={`rounded-xl border p-4 transition-all duration-200 peer-focus-visible:ring-2 peer-focus-visible:ring-yellow-50 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-richblack-900 ${active ? 'border-caribbeangreen-200 bg-caribbeangreen-500/10 shadow-[0_0_24px_rgba(6,214,160,0.06)]' : 'border-richblack-600 bg-richblack-800/60 group-hover:border-richblack-300 group-hover:bg-richblack-700/50'}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${active ? 'bg-caribbeangreen-200/15 text-caribbeangreen-100' : 'bg-richblack-700 text-richblack-200'}`}><FiLayers size={18} /></span>
                <div className="min-w-0">
                  <span className="block break-words text-sm font-semibold tracking-wide text-richblack-5">{plan.plan_name}</span>
                  <span className="text-xs text-richblack-300">{unlimited(plan) ? 'Unlimited course access' : `${remaining} course ${remaining === 1 ? 'credit' : 'credits'} available`}</span>
                </div>
              </div>
              <span aria-hidden="true" className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors ${active ? 'border-caribbeangreen-100 bg-caribbeangreen-100 text-richblack-900' : 'border-richblack-400'}`}>{active && <FiCheck size={13} strokeWidth={3} />}</span>
            </div>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-richblack-700" aria-hidden="true"><div className={`h-full rounded-full transition-all duration-300 ${active ? 'bg-caribbeangreen-100' : 'bg-richblack-300'}`} style={{ width: `${percent}%` }} /></div>
            <div className="mt-2 flex flex-wrap justify-between gap-x-3 gap-y-1 text-[11px] text-richblack-300">
              <span>{unlimited(plan) ? 'Unlimited credits' : `${plan.courses.used ?? 0} of ${total || remaining} credits used`}</span>
              {plan.validity?.end && <span>{/lifetime/i.test(plan.validity.end) ? plan.validity.end : `Valid until ${plan.validity.end}`}</span>}
            </div>
          </div>
        </label>;
      })}
      <label className="group block cursor-pointer">
        <input type="radio" name="checkout-plan" value="" checked={!value} onChange={() => onChange('')} aria-label="Pay without using a plan" className="peer sr-only" />
        <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-yellow-50 ${!value ? 'border-yellow-50 bg-yellow-50/5 text-richblack-5' : 'border-richblack-700 text-richblack-300 group-hover:border-richblack-400'}`}>
          <FiCreditCard className="shrink-0" />
          <span className="flex-1 text-xs">Pay separately · keep your credits</span>
          <span aria-hidden="true" className={`h-3.5 w-3.5 rounded-full border ${!value ? 'border-yellow-50 bg-yellow-50' : 'border-richblack-400'}`} />
        </div>
      </label>
    </div>
    {selected && <div role="status" className="rounded-xl border border-caribbeangreen-200/20 bg-caribbeangreen-500/5 p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-xs font-medium text-caribbeangreen-100"><FiCheck className="shrink-0" /> Course fully covered</span>
        <span className="whitespace-nowrap text-sm font-bold text-caribbeangreen-100">Save ₹{price}</span>
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs text-richblack-200">
        <span>{unlimited(selected) ? 'Unlimited' : selected.courses.remaining} credits</span>
        <FiArrowRight className="text-richblack-400" />
        <span className="font-medium text-richblack-5">{unlimited(selected) ? 'Unlimited' : Math.max(0, Number(selected.courses.remaining) - 1)} after enrollment</span>
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-richblack-300">One credit is used only when you enroll.</p>
    </div>}
  </fieldset>;
}

CheckoutPlanPicker.propTypes = {
  plans: PropTypes.arrayOf(PropTypes.shape({
    activation_code: PropTypes.string.isRequired,
    plan_name: PropTypes.string.isRequired,
    courses: PropTypes.shape({ remaining: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired, used: PropTypes.number, total: PropTypes.number }).isRequired,
    validity: PropTypes.shape({ end: PropTypes.string })
  })).isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  price: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired
};
