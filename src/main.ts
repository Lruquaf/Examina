import { Examina } from './Examina.js';
import { Field, Mina, PrivateKey, AccountUpdate, MerkleMap } from 'o1js';
import { CalculateScore } from './ExaminaRecursion.js';

const useProof = false;
const Local = Mina.LocalBlockchain({ proofsEnabled: useProof });
Mina.setActiveInstance(Local);

const { privateKey: deployerKey, publicKey: deployerAccount } =
    Local.testAccounts[0];
const { privateKey: senderKey, publicKey: senderAccount } =
    Local.testAccounts[1];

const zkAppPrivateKey = PrivateKey.random();
const zkAppAddress = zkAppPrivateKey.toPublicKey();
const zkAppInstance = new Examina(zkAppAddress);
const deployTxn = await Mina.transaction(deployerAccount, () => {
    AccountUpdate.fundNewAccount(deployerAccount);
    zkAppInstance.deploy();
});
await deployTxn.sign([deployerKey, zkAppPrivateKey]).send();

let num1 = zkAppInstance.answers.get();
console.log('Initial answers: ', num1.toString());

const map = new MerkleMap();
map.set(Field(0), Field(1010101010));

const userAnswersMap = new MerkleMap();

const answers = Field(123012301241230);
const userAnswer = Field(123123123123133);
const salt = Field.random();

const txn1 = await Mina.transaction(senderAccount, () => {
    zkAppInstance.initState(
        answers,
        salt,
        map.getRoot(),
        userAnswersMap.getRoot()
    );
});
await txn1.prove();
await txn1.sign([senderKey, zkAppPrivateKey]).send();
num1 = zkAppInstance.answers.get();
console.log('current answers: ', num1.toString());

let merkleWitness = userAnswersMap.getWitness(
    Field(BigInt(parseInt(deployerAccount.toBase58(), 16)))
);

let num4 = zkAppInstance.userScores.get();
console.log('users scores before txn4: ', num4.toString());

const txn4 = await Mina.transaction(deployerAccount, () => {
    zkAppInstance.submitAnswers(
        merkleWitness,
        Field(BigInt(parseInt(deployerAccount.toBase58(), 16))),
        userAnswer
    );
});
await txn4.prove();
await txn4.sign([deployerKey, zkAppPrivateKey]).send();

num4 = zkAppInstance.userScores.get();
console.log('users scores after txn4: ', num4.toString());

let num2 = zkAppInstance.isOver.get();
console.log('isOver before txn2: ', num2.toString());

num1 = zkAppInstance.answers.get();
console.log('answers before txn2: ', num1.toString());

const txn2 = await Mina.transaction(senderAccount, () => {
    zkAppInstance.publishAnswers(answers, salt);
});
await txn2.prove();
await txn2.sign([senderKey, zkAppPrivateKey]).send();

num2 = zkAppInstance.isOver.get();
console.log('isOver after txn2: ', num2.toString());

num1 = zkAppInstance.answers.get();
console.log('answers after txn2: ', num1.toString());

let num3 = zkAppInstance.hashedQuestions.get();
console.log('questions hash before txn3: ', num3.toString());

const txn3 = await Mina.transaction(deployerAccount, () => {
    zkAppInstance.checkQuestions(map.getRoot());
});
await txn3.prove();
await txn3.sign([deployerKey, zkAppPrivateKey]).send();

num3 = zkAppInstance.hashedQuestions.get();
console.log('questions hash after txn3: ', num3.toString());

// const { verificationKey } = await CalculateScore.compile();

// var proof = await CalculateScore.baseCase(Field(1));
// var x = Field(10);
// var score = Field(0);

// for (let index = 0; index < 3; index++) {
//     console.log('x main.ts: ', x.toString());

//     const proof1 = await CalculateScore.step(
//         x,
//         proof,
//         Field(2333355),
//         Field(1000050),
//         score
//     );
//     proof = proof1;

//     x = x.mul(10);
//     score = proof.publicOutput;

//     console.log(score.toString());
// }

// let num5 = zkAppInstance.userScores.get();
// console.log('state after txn5: ', num5.toString());

// userAnswersMap.set(Field(deployerAccount.toBase58()), Field(1));
// merkleWitness = userAnswersMap.getWitness(Field(0));

// const txn5 = await Mina.transaction(deployerAccount, () => {
//     zkAppInstance.checkScore(proof);
// });
// await txn5.prove();
// await txn5.sign([deployerKey, zkAppPrivateKey]).send();

// num5 = zkAppInstance.userScores.get();
// console.log('state after txn5: ', num5.toString());
