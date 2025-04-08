"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importStar(require("react"));
const StartupForm = ({ onStartupAdded }) => {
    const [formData, setFormData] = (0, react_1.useState)({
        name: '',
        details: '',
        stage: '',
        roles: ['']
    });
    const [isSubmitting, setIsSubmitting] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => (Object.assign(Object.assign({}, prev), { [name]: value })));
    };
    const handleRoleChange = (index, value) => {
        const updatedRoles = [...formData.roles];
        updatedRoles[index] = value;
        setFormData(prev => (Object.assign(Object.assign({}, prev), { roles: updatedRoles })));
    };
    const addRoleField = () => {
        if (formData.roles.length >= 5) {
            alert('You can add up to 5 roles only');
            return;
        }
        setFormData(prev => (Object.assign(Object.assign({}, prev), { roles: [...prev.roles, ''] })));
    };
    const removeRoleField = (index) => {
        if (formData.roles.length <= 1) {
            return;
        }
        const updatedRoles = formData.roles.filter((_, i) => i !== index);
        setFormData(prev => (Object.assign(Object.assign({}, prev), { roles: updatedRoles })));
    };
    const handleSubmit = (e) => __awaiter(void 0, void 0, void 0, function* () {
        e.preventDefault();
        // Basic validation
        if (!formData.name || !formData.details || !formData.stage || formData.roles.some(role => !role.trim())) {
            setError('Please fill in all required fields');
            return;
        }
        try {
            setIsSubmitting(true);
            setError(null);
            const response = yield fetch('/api/startups', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: formData.name,
                    details: formData.details,
                    stage: formData.stage,
                    roles: formData.roles.filter(role => role.trim() !== '')
                })
            });
            if (!response.ok) {
                const errorData = yield response.json();
                throw new Error(errorData.error || 'Failed to register startup');
            }
            // Reset form
            setFormData({
                name: '',
                details: '',
                stage: '',
                roles: ['']
            });
            // Notify parent
            onStartupAdded();
            alert('Startup registered successfully!');
        }
        catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            }
            else {
                setError('An unexpected error occurred');
            }
            console.error(err);
        }
        finally {
            setIsSubmitting(false);
        }
    });
    return (<div className="card shadow mb-4">
      <div className="card-header">
        <h2 className="text-center mb-0">Register New Startup</h2>
      </div>
      <div className="card-body">
        {error && (<div className="alert alert-danger" role="alert">
            {error}
          </div>)}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="name" className="form-label">Startup Name</label>
            <input type="text" className="form-control" id="name" name="name" value={formData.name} onChange={handleChange} required/>
          </div>
          
          <div className="mb-3">
            <label htmlFor="details" className="form-label">Startup Details</label>
            <textarea className="form-control" id="details" name="details" rows={3} value={formData.details} onChange={handleChange} required/>
          </div>
          
          <div className="mb-3">
            <label htmlFor="stage" className="form-label">Startup Stage</label>
            <select className="form-select" id="stage" name="stage" value={formData.stage} onChange={handleChange} required>
              <option value="" disabled>Select stage</option>
              <option value="Idea">Idea</option>
              <option value="MVP">MVP</option>
              <option value="Pre-seed">Pre-seed</option>
              <option value="Seed">Seed</option>
              <option value="Series A">Series A</option>
              <option value="Series B or later">Series B or later</option>
            </select>
          </div>
          
          <div className="mb-3">
            <label className="form-label">Roles Available (up to 5)</label>
            {formData.roles.map((role, index) => (<div className="input-group mb-2" key={index}>
                <input type="text" className="form-control" placeholder="Role title" value={role} onChange={(e) => handleRoleChange(index, e.target.value)} required/>
                <button type="button" className="btn btn-danger" onClick={() => removeRoleField(index)} disabled={formData.roles.length <= 1}>
                  Remove
                </button>
              </div>))}
            <button type="button" className="btn btn-secondary mt-2" onClick={addRoleField} disabled={formData.roles.length >= 5}>
              Add Another Role
            </button>
            <small className="form-text text-muted d-block">You can add up to 5 roles.</small>
          </div>
          
          <div className="d-grid">
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? (<>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Registering...
                </>) : 'Register Startup'}
            </button>
          </div>
        </form>
      </div>
    </div>);
};
exports.default = StartupForm;
