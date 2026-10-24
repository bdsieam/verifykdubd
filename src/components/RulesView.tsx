import React from 'react';

export const RulesView: React.FC = () => {
  const rules = [
    {
      title: '১. পারস্পরিক সম্মান ও সৌজন্য',
      desc: 'ক্যাম্পাস ও মেসেঞ্জার গ্রুপে সকল সহপাঠী ও প্রতিনিধিদের সাথে মার্জিত আচরণ করতে হবে।',
    },
    {
      title: '২. হয়রানি ও বৈষম্যে শূন্য সহনশীলতা',
      desc: 'কোনো ধরনের বুলিং, কটূক্তি বা অশালীন বার্তা দিলে সদস্যপদ স্থায়ীভাবে বাতিল হবে।',
    },
    {
      title: '৩. ভুয়া তথ্য ও স্প্যাম সম্পূর্ণ নিষিদ্ধ',
      desc: 'অননুমোদিত ব্যবসায়িক প্রচারণা বা বিভ্রান্তিকর কোনো পোস্ট করা যাবে না।',
    },
    {
      title: '৪. সত্য তথ্য নিশ্চিতকরণ',
      desc: 'সবসময় নিজের আসল পরিচয় ও সঠিক নথি ব্যবহার করতে হবে।',
    },
    {
      title: '৫. তথ্যের গোপনীয়তা রক্ষা',
      desc: 'অনুমতি ছাড়া সহপাঠীদের ব্যক্তিগত তথ্য বা স্ক্রিনশট শেয়ার করা যাবে না।',
    },
    {
      title: '৬. শৃঙ্খলামূলক নীতিমালা',
      desc: 'নিয়ম ভঙ্গের তীব্রতা বিবেচনায় সতর্কতা বা স্থায়ী বহিষ্কারের সিদ্ধান্ত নেওয়া হবে।',
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm max-w-md mx-auto p-6 space-y-4">
      <div>
        <h2 className="text-lg font-bold text-slate-900">
          কমিউনিটি নীতিমালা
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          কেডিইউ বাংলাদেশি শিক্ষার্থী কমিউনিটির নিয়ম ও আচরণবিধি।
        </p>
      </div>

      <div className="divide-y divide-slate-100 text-xs">
        {rules.map((rule, idx) => (
          <div key={idx} className="py-3 first:pt-0 last:pb-0 space-y-0.5">
            <h4 className="font-semibold text-slate-800">{rule.title}</h4>
            <p className="text-slate-500 leading-relaxed text-[11px]">{rule.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
