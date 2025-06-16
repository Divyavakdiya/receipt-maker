import React, { useRef, useState } from "react";

import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import "./ReceiptForm.css";


const ReceiptForm = () => { 

  const receiptRef = useRef();
  const [formData, setFormData] = useState({
    name: "",
    date: "",
    receiptNo: "",
    village: "",
    amount: "",
    amountWords: "",
    receivedBy: "", // Added receivedBy field
  });
  const [donations, setDonations] = useState([
    { detail: "થાળ ભેટ", amount: "", note: "", selected: false },
    { detail: "ધોતિયા", amount: "", note: "", selected: false },
    { detail: "કાયમી તિથિ", amount: "", note: "", selected: false },
    { detail: "ઉત્સવ", amount: "", note: "", selected: false },
    { detail: "રસોઇ", amount: "", note: "", selected: false },
    { detail: "બાંધકામ/ભૂમિદાન", amount: "", note: "", selected: false },
  ]);
  
const isFormValid = () => {
  if (
    !formData.name.trim() ||
    !formData.date ||
    !formData.village.trim() ||
    !formData.receivedBy.trim()
  ) {
    return false; // required fields empty
  }

  // At least one donation selected
  const selectedDonations = donations.filter((d) => d.selected);
  if (selectedDonations.length === 0) return false;

  // All selected donations must have a positive amount
  for (let donation of selectedDonations) {
    if (!donation.amount || Number(donation.amount) <= 0) {
      return false;
    }
  }

  return true; // all good
};

  const handleCheckboxChange = (index) => {
    const updated = [...donations];
    updated[index].selected = !updated[index].selected;
    setDonations(updated);
  };

  const handleAmountChange = (index, value) => {
    const updated = [...donations];
    updated[index].amount = value;
    setDonations(updated);
  };

  const handleNoteChange = (index, value) => {
    const updated = [...donations];
    updated[index].note = value;
    setDonations(updated);
  };

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData({ ...formData, [id]: value });
  };

  const { receivedBy } = formData;

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    // Step 1: Auto generate receipt number
    const current = parseInt(localStorage.getItem("receiptCounter") || "1", 10);
    const newReceiptNo = `RN-${String(current).padStart(4, "0")}`;

  
    const total = donations
      .filter((d) => d.selected)
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);
  
    // Step 2: Update localStorage counter
    localStorage.setItem("receiptCounter", (current + 1).toString());
  
    // Step 3: Update form data
    const updatedFormData = {
      ...formData,
      receiptNo: newReceiptNo,
      amount: total,
      amountWords: `Rs.${convertToWords(total)} Only.`,

    };
    setFormData(updatedFormData);
  
    // Step 4: Send to Google Sheet
    await sendToGoogleSheet(updatedFormData);
  
    console.log("Receipt generated and sent to Google Sheet ✅");
    
    
    
  };
  
  const sendToGoogleSheet = async (data) => {
    const formURL = "https://docs.google.com/forms/d/e/1FAIpQLSfG8MmecvpLebxJRsHwMzSh26eRV9dlv_DWUsc-65JzuP4vaQ/formResponse";
  
    
  const formDataToSend = new FormData();
  formDataToSend.append("entry.2095390315", data.receiptNo);
  formDataToSend.append("entry.1538471637", data.name);
  formDataToSend.append("entry.297142929", data.date);
  formDataToSend.append("entry.982194765", data.village);
  formDataToSend.append("entry.672223610", data.amount);
  formDataToSend.append("entry.1448350958", data.amountWords);
  formDataToSend.append("entry.1794073414", data.receivedBy);
  

  const selectedDonations = donations
    .filter((d) => d.selected)
    .map((d) => `${d.detail}: ₹${d.amount} (${d.note})`)
    .join(", ");
  formDataToSend.append("entry.407953826", selectedDonations);

  await fetch(formURL, {
    method: "POST",
    mode: "no-cors",
    body: formDataToSend,
  });

  alert("Submitted to Google Sheet ✅");
};


  

  const downloadPDF = () => {
    const input = receiptRef.current;
   if (!input) {
    alert("Receipt is not available to generate PDF.");
    return;
  }

    html2canvas(input, { scale: 2 }).then((canvas) => {
    const formImgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");

      
      const background = new Image();
    background.src = process.env.PUBLIC_URL + "/Swaminarayan_mandir.jpg";

    background.onload = () => {
      pdf.addImage(background, "JPEG", 0, 0, 210, 297);

    const pdfWidth = 200;
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(formImgData, "PNG", 5, 60, pdfWidth, pdfHeight);

      pdf.save("receipt.pdf");
    };
      background.onerror = () => {
      // If background image fails, just add receipt content
      pdf.addImage(formImgData, "PNG", 5, 60, 200, 170);
      pdf.save("receipt.pdf");
    };
  });
};
  



  const convertToWords = (num) => {
    const a = [
      "",
      "One",
      "Two",
      "Three",
      "Four",
      "Five",
      "Six",
      "Seven",
      "Eight",
      "Nine",
      "Ten",
      "Eleven",
      "Twelve",
      "Thirteen",
      "Fourteen",
      "Fifteen",
      "Sixteen",
      "Seventeen",
      "Eighteen",
      "Nineteen",
    ];
    const b = [
      "",
      "",
      "Twenty",
      "Thirty",
      "Forty",
      "Fifty",
      "Sixty",
      "Seventy",
      "Eighty",
      "Ninety",
    ];

    if (num === 0) return "Zero";

    const convert = (n) => {
      if (n < 20) return a[n];
      if (n < 100)
        return b[Math.floor(n / 10)] + (n % 10 ? " " + a[n % 10] : "");
      if (n < 1000)
        return (
          a[Math.floor(n / 100)] +
          " Hundred" +
          (n % 100 ? " and " + convert(n % 100) : "")
        );
      if (n < 100000)
        return (
          convert(Math.floor(n / 1000)) +
          " Thousand" +
          (n % 1000 ? " " + convert(n % 1000) : "")
        );
      if (n < 10000000)
        return (
          convert(Math.floor(n / 100000)) +
          " Lakh" +
          (n % 100000 ? " " + convert(n % 100000) : "")
        );
      return (
        convert(Math.floor(n / 10000000)) +
        " Crore" +
        (n % 10000000 ? " " + convert(n % 10000000) : "")
      );
    };

    return convert(num) + " Only";
  };

  const totalAmount = donations
    .filter((d) => d.selected)
    .reduce((total, item) => total + Number(item.amount || 0), 0);

  const printReceipt = () => {
  const printContents = receiptRef.current.innerHTML;
  const printWindow = window.open("", "", "width=800,height=600");
  printWindow.document.write(`
    <html>
      <head>
        <title>Receipt</title>
        <style>
          body { font-family: Verdana, sans-serif; padding: 20px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid black; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
        </style>
      </head>
      <body>${printContents}</body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
  printWindow.close();
};


    

  return (
  

    <div  id="receipt" className="receipt-container">
      <form onSubmit={handleSubmit}>
        <label>Receipt_No:</label>
        <input type="text" id="receiptNo" value={formData.receiptNo} readOnly />

        <label>Name:</label>
        <input type="text" id="name" required onChange={handleChange} />

        <label>Date:</label>
        <input type="date" id="date" required onChange={handleChange} />

        <label>City:</label>
        <input type="text" id="village" required onChange={handleChange} />

        {donations.map((item, index) => (
          <div key={index} className="donation-row">
            <input
              type="checkbox"
              checked={item.selected}
              onChange={() => handleCheckboxChange(index)}
            />
            <label className="donation-label">{item.detail}</label>
            {item.selected && (
              <>
                <input
                  type="number"
                  placeholder="Amount"
                  className="amount-input"
                  value={item.amount}
                  onChange={(e) => handleAmountChange(index, e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Note"
                  className="note-input"
                  value={item.note}
                  onChange={(e) => handleNoteChange(index, e.target.value)}
                />
              </>
            )}
          </div>
        ))}

        <label>Received By:</label>
        <input type="text" id="receivedBy" onChange={handleChange} />

        <button type="submit" id="handleSubmit"  disabled={!isFormValid()}>
  Generate
</button>

      </form>

      <div className="receipt" ref={receiptRef}>
        {/* <h2>શ્રી સ્વામિનારાયણ મંદિર કોસાડ (સુરત)</h2> */}
        <div className="header">
          <div>Date: {formData.date}</div>
          <div>Receipt No: {formData.receiptNo}</div>
        </div>
        <div>Name: {formData.name}</div>
        <div>City: {formData.village}</div>
        <br />
        <table>
          <thead>
            <tr>
              <th>Donation_Detail</th>
              <th>Amount</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>
            {donations
              .filter((d) => d.selected)
              .map((donation, index) => (
                <tr key={index}>
                  <td>{donation.detail}</td>
                  <td>Rs.{donation.amount}</td>
                  <td>{donation.note}</td>
                </tr>
              ))}
          </tbody>
          <tfoot>
            <tr>
              <td>
                <strong>Total</strong>
              </td>
              <td colSpan="2">
                Rs.
                {donations
                  .filter((d) => d.selected)
                  .reduce((total, item) => total + Number(item.amount || 0), 0)}
              </td>
            </tr>
            <tr>
              <td>
                <strong>Amount in words:</strong>
              </td>
              <td>{convertToWords(totalAmount || 0)}</td>
            </tr>
          </tfoot>
        </table>

        <br />

        <div style={{ textAlign: "right", marginTop: "20px" }}>
          Received By: {receivedBy || "______________"}
        </div>
      </div>

      <div className="actions">
        <button onClick={downloadPDF}>Download PDF</button>
        <button onClick={printReceipt}>Print Receipt</button>{" "}
        {/* New Print button */}
      </div>
    </div>
  );
};

export default ReceiptForm;
