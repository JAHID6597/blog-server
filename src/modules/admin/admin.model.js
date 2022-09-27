const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const adminSchema = mongoose.Schema(
    {
        firstName: String,
        lastName: String,
        userName: {
            type: String,
            required: true,
            unique: true
        },
        email: {
            type: String,
            required: true
        },
        password: {
            type: String,
            required: true
        },
        isActive: {
            type: Boolean,
            required: true,
            default: true
        }
    },
    {
        timestamps: true
    }
);

adminSchema.pre("save", async function (next) {
	if (this.isModified('password')) {
		const hash = await bcrypt.hash(this.password, 10);
		this.password = hash;
	}

	next();
});

adminSchema.methods.comparePassword = async function (password) {
	const result = await bcrypt.compare(password, this.password);
	return result;
}

const Admin = mongoose.model("admins", adminSchema);
module.exports = Admin;
