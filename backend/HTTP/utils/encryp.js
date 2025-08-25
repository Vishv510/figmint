import bcrypt from 'bcrypt';

const saltRounds = 9;

export async function hashPassword(password) {
    try{
        const salt = await bcrypt.genSalt(saltRounds);
        const hash = await bcrypt.hash(password, salt);

        return hash;
    } catch(err){
        console.error("Encryption error:", err);
        throw new Error("Encryption failed");
    }
}


export async function comparePassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}